package com.vazoclash.tracker;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private String targetViewOnLoad = null;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);

        Intent intent = getIntent();
        if (intent != null && intent.hasExtra("target_view")) {
            targetViewOnLoad = intent.getStringExtra("target_view");
        }

        // Configure WebView Asset Loader for safe local asset serving
        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
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

        // Set WebViewClient with offline API interception
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String path = request.getUrl().getPath();

                // Intercept mock API calls to serve offline bundled JSON data
                if (path != null && path.startsWith("/api/")) {
                    WebResourceResponse apiResp = handleOfflineApi(path, request);
                    if (apiResp != null) return apiResp;
                }

                // Default asset loader
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
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
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null && intent.hasExtra("target_view") && webView != null) {
            String view = intent.getStringExtra("target_view");
            webView.evaluateJavascript("if (typeof switchNav === 'function') switchNav('" + view + "');", null);
        }
    }

    private WebResourceResponse handleOfflineApi(String path, WebResourceRequest request) {
        try {
            AssetManager am = getAssets();
            if (path.equals("/api/progression")) {
                InputStream is = am.open("data/th_progression.json");
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
                    try {
                        java.net.URL u = new java.net.URL(targetUrl);
                        java.net.HttpURLConnection conn = (java.net.HttpURLConnection) u.openConnection();
                        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");
                        conn.setConnectTimeout(8000);
                        conn.setReadTimeout(8000);
                        conn.setInstanceFollowRedirects(true);
                        int code = conn.getResponseCode();
                        if (code >= 200 && code < 400) {
                            String ct = conn.getContentType();
                            if (ct == null || ct.isEmpty()) ct = "image/png";
                            return new WebResourceResponse(ct, null, conn.getInputStream());
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
