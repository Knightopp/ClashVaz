package com.vazoclash.tracker;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import com.vazoclash.tracker.data.VillageDataStore;
import com.vazoclash.tracker.widget.UpgradesWidgetProvider;

public class AndroidBridge {
    private final Context context;

    public AndroidBridge(Context context) {
        this.context = context;
    }

    @JavascriptInterface
    public void syncUpgradesToWidget(String jsonStr) {
        if (jsonStr == null || jsonStr.isEmpty()) return;
        try {
            VillageDataStore.saveProfileJson(context, jsonStr);

            // Broadcast update to Home Screen Widget
            Intent intent = new Intent(context, UpgradesWidgetProvider.class);
            intent.setAction(UpgradesWidgetProvider.ACTION_REFRESH_WIDGET);
            context.sendBroadcast(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @JavascriptInterface
    public void vibrate(int durationMs) {
        try {
            Vibrator v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(Math.max(10, durationMs), VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(Math.max(10, durationMs));
                }
            }
        } catch (Exception ignored) {}
    }

    @JavascriptInterface
    public void showToast(String msg) {
        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
    }
}
