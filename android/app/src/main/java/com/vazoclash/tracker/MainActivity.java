package com.vazoclash.tracker;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.res.AssetManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.InputStream;
import java.net.URLDecoder;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private String targetViewOnLoad = null;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView.setWebContentsDebuggingEnabled(true);

        // Immersive Fullscreen Configuration (prevent notification bar collision)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        setContentView(R.layout.activity_main);
        applyImmersiveMode();

        webView = findViewById(R.id.webview);

        Intent intent = getIntent();
        if (intent != null && intent.hasExtra("target_view")) {
            targetViewOnLoad = intent.getStringExtra("target_view");
        }

        // Configure WebView Asset Loader for safe local asset serving
        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .addPathHandler("/downloads/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Inject Native Bridge
        webView.addJavascriptInterface(new AndroidBridge(this), "Android");

        // Set WebViewClient with offline API and download asset interception
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String path = request.getUrl().getPath();

                // Intercept mock API calls to serve offline bundled JSON data
                if (path != null && path.startsWith("/api/")) {
                    WebResourceResponse apiResp = handleOfflineApi(path, request);
                    if (apiResp != null) return apiResp;
                }

                // Intercept local bundled /downloads/ images directly
                if (path != null && path.startsWith("/downloads/")) {
                    WebResourceResponse dlResp = handleOfflineDownload(path);
                    if (dlResp != null) return dlResp;
                }

                // Default asset loader
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                applyImmersiveMode();
                if (targetViewOnLoad != null) {
                    view.evaluateJavascript("if (typeof switchNav === 'function') switchNav('" + targetViewOnLoad + "');", null);
                    targetViewOnLoad = null;
                }
            }
        });

        // Load the local bundled HTML entrypoint
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");

        // Back button navigation
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersiveMode();
        }
    }

    private void applyImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            );
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null && intent.hasExtra("target_view") && webView != null) {
            String view = intent.getStringExtra("target_view");
            webView.evaluateJavascript("if (typeof switchNav === 'function') switchNav('" + view + "');", null);
        }
    }

    private WebResourceResponse handleOfflineDownload(String path) {
        try {
            AssetManager am = getAssets();
            String decoded = URLDecoder.decode(path, "UTF-8");
            String assetPath = decoded.startsWith("/") ? decoded.substring(1) : decoded;
            InputStream is = am.open(assetPath);
            String mime = "image/png";
            if (assetPath.endsWith(".webp")) {
                mime = "image/webp";
            } else if (assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg")) {
                mime = "image/jpeg";
            } else if (assetPath.endsWith(".svg")) {
                mime = "image/svg+xml";
            }
            return new WebResourceResponse(mime, null, is);
        } catch (Exception e) {
            Log.w("VazoClash", "Offline download asset not found: " + path);
            return null;
        }
    }

    private String getLocalAssetForUrl(String url) {
        if (url == null) return null;
        String lower = url.toLowerCase();
        for (int i = 1; i <= 19; i++) {
            if (lower.contains("town_hall" + i + ".") || lower.contains("town_hall" + i + "_") || lower.contains("townhall" + i + ".")) {
                return "downloads/images/Town_Hall/Town_Hall" + i + ".png";
            }
        }
        if (lower.contains("barbarian_king")) return "downloads/images/Heroes/barbarian_king.webp";
        if (lower.contains("archer_queen")) return "downloads/images/Heroes/archer_queen.webp";
        if (lower.contains("grand_warden")) return "downloads/images/Heroes/grand_warden.webp";
        if (lower.contains("royal_champion")) return "downloads/images/Heroes/royal_champion.webp";
        if (lower.contains("minion_prince")) return "downloads/images/Heroes/minion_prince.webp";
        if (lower.contains("dragon_duke")) return "downloads/images/Heroes/dragon_duke.webp";

        if (lower.contains("shield.png")) return "downloads/images/ui/shield.png";
        if (lower.contains("trophy.png")) return "downloads/images/ui/trophy.png";
        if (lower.contains("hammer_of_building")) return "downloads/images/ui/hammer_building.png";
        if (lower.contains("builder.png")) return "downloads/images/ui/builder.png";
        if (lower.contains("leaguemedal")) return "downloads/images/ui/league_medal.png";
        if (lower.contains("raid_medal")) return "downloads/images/ui/raid_medal.png";
        if (lower.contains("challengesicon")) return "downloads/images/ui/challenge_upgrade.png";
        if (lower.contains("clock_tower_potion")) return "downloads/images/ui/clock_potion.png";
        if (lower.contains("titan_league")) return "downloads/images/ui/titan_league.png";
        if (lower.contains("trader_setup")) return "downloads/images/ui/trader.png";
        return null;
    }

    private WebResourceResponse handleOfflineApi(String path, WebResourceRequest request) {
        try {
            AssetManager am = getAssets();
            if (path.equals("/api/progression")) {
                InputStream is = am.open("data/th_progression.json");
                return new WebResourceResponse("application/json", "UTF-8", is);
            } else if (path.equals("/api/th-images")) {
                InputStream is = am.open("data/th_images.json");
                return new WebResourceResponse("application/json", "UTF-8", is);
            } else if (path.equals("/api/data")) {
                InputStream is = am.open("data/extracted_buildings.json");
                return new WebResourceResponse("application/json", "UTF-8", is);
            } else if (path.equals("/api/village/current")) {
                InputStream is = am.open("data/village_profiles.json");
                return new WebResourceResponse("application/json", "UTF-8", is);
            } else if (path.equals("/api/village/layouts")) {
                InputStream is = am.open("data/village_layouts.json");
                return new WebResourceResponse("application/json", "UTF-8", is);
            } else if (path.equals("/api/official-progression")) {
                InputStream is = am.open("data/official_sc_progression.json");
                return new WebResourceResponse("application/json", "UTF-8", is);
            } else if (path.startsWith("/api/proxy-image")) {
                String targetUrl = request.getUrl().getQueryParameter("url");
                if (targetUrl != null && !targetUrl.isEmpty()) {
                    String localAsset = getLocalAssetForUrl(targetUrl);
                    if (localAsset != null) {
                        try {
                            InputStream is = am.open(localAsset);
                            String mime = localAsset.endsWith(".webp") ? "image/webp" : "image/png";
                            return new WebResourceResponse(mime, null, is);
                        } catch (Exception ignored) {}
                    }
                    try {
                        java.net.URL u = new java.net.URL(targetUrl);
                        java.net.HttpURLConnection conn = (java.net.HttpURLConnection) u.openConnection();
                        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");
                        conn.setRequestProperty("Referer", "https://clashofclans.fandom.com/");
                        conn.setConnectTimeout(4000);
                        conn.setReadTimeout(4000);
                        conn.setInstanceFollowRedirects(true);
                        int code = conn.getResponseCode();
                        if (code >= 200 && code < 400) {
                            String ct = conn.getContentType();
                            if (ct == null || ct.isEmpty()) ct = "image/png";
                            return new WebResourceResponse(ct, null, conn.getInputStream());
                        }
                    } catch (Exception e) {
                        Log.e("VazoClash", "Error proxying image online: " + targetUrl);
                    }
                    // Offline fallback: serve cannon level 1 instead of empty image
                    try {
                        InputStream is = am.open("downloads/images/Cannon_Home_Village/level-1.png");
                        return new WebResourceResponse("image/png", null, is);
                    } catch (Exception ignored) {}
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
