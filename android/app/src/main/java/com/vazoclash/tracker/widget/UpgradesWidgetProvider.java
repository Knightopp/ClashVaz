package com.vazoclash.tracker.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;
import com.vazoclash.tracker.MainActivity;
import com.vazoclash.tracker.R;
import com.vazoclash.tracker.data.VillageDataStore;
import java.util.List;

public class UpgradesWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_REFRESH_WIDGET = "com.vazoclash.tracker.ACTION_REFRESH_WIDGET";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH_WIDGET.equals(intent.getAction()) ||
            AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName name = new ComponentName(context, UpgradesWidgetProvider.class);
            int[] ids = manager.getAppWidgetIds(name);
            onUpdate(context, manager, ids);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_upgrades);

        String playerName = VillageDataStore.getPlayerName(context);
        int thLevel = VillageDataStore.getTownHallLevel(context);
        int progress = VillageDataStore.getProgressPercent(context);
        int totalBuildings = VillageDataStore.getTotalBuildings(context);

        views.setTextViewText(R.id.widget_player_name, playerName);
        views.setTextViewText(R.id.widget_village_sub, "Town Hall " + thLevel + " • " + progress + "% (" + totalBuildings + "/142)");
        views.setTextViewText(R.id.widget_th_badge, "TH" + thLevel);

        List<VillageDataStore.UpgradeItem> upgrades = VillageDataStore.getActiveUpgrades(context);

        if (upgrades.isEmpty()) {
            views.setViewVisibility(R.id.widget_empty_text, View.VISIBLE);
            views.setViewVisibility(R.id.upgrade_row_1, View.GONE);
            views.setViewVisibility(R.id.upgrade_row_2, View.GONE);
            views.setViewVisibility(R.id.upgrade_row_3, View.GONE);
            views.setViewVisibility(R.id.upgrade_row_4, View.GONE);
            views.setViewVisibility(R.id.widget_footer_text, View.GONE);
        } else {
            views.setViewVisibility(R.id.widget_empty_text, View.GONE);

            // Row 1
            if (upgrades.size() > 0) {
                views.setViewVisibility(R.id.upgrade_row_1, View.VISIBLE);
                views.setTextViewText(R.id.upgrade_title_1, upgrades.get(0).getDisplayTitle());
                views.setTextViewText(R.id.upgrade_timer_1, upgrades.get(0).getFormattedRemainingTime());
            } else {
                views.setViewVisibility(R.id.upgrade_row_1, View.GONE);
            }

            // Row 2
            if (upgrades.size() > 1) {
                views.setViewVisibility(R.id.upgrade_row_2, View.VISIBLE);
                views.setTextViewText(R.id.upgrade_title_2, upgrades.get(1).getDisplayTitle());
                views.setTextViewText(R.id.upgrade_timer_2, upgrades.get(1).getFormattedRemainingTime());
            } else {
                views.setViewVisibility(R.id.upgrade_row_2, View.GONE);
            }

            // Row 3
            if (upgrades.size() > 2) {
                views.setViewVisibility(R.id.upgrade_row_3, View.VISIBLE);
                views.setTextViewText(R.id.upgrade_title_3, upgrades.get(2).getDisplayTitle());
                views.setTextViewText(R.id.upgrade_timer_3, upgrades.get(2).getFormattedRemainingTime());
            } else {
                views.setViewVisibility(R.id.upgrade_row_3, View.GONE);
            }

            // Row 4
            if (upgrades.size() > 3) {
                views.setViewVisibility(R.id.upgrade_row_4, View.VISIBLE);
                views.setTextViewText(R.id.upgrade_title_4, upgrades.get(3).getDisplayTitle());
                views.setTextViewText(R.id.upgrade_timer_4, upgrades.get(3).getFormattedRemainingTime());
            } else {
                views.setViewVisibility(R.id.upgrade_row_4, View.GONE);
            }

            int extra = upgrades.size() - 4;
            if (extra > 0) {
                views.setViewVisibility(R.id.widget_footer_text, View.VISIBLE);
                views.setTextViewText(R.id.widget_footer_text, "+" + extra + " more upgrades • Tap to open VazoClash");
            } else {
                views.setTextViewText(R.id.widget_footer_text, "Tap to open VazoClash");
            }
        }

        // Tap entire widget -> open app directly to upgrades view
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.putExtra("target_view", "upgrades");
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingLaunch = PendingIntent.getActivity(
                context, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingLaunch);

        // Tap refresh button -> broadcast refresh intent
        Intent refreshIntent = new Intent(context, UpgradesWidgetProvider.class);
        refreshIntent.setAction(ACTION_REFRESH_WIDGET);
        PendingIntent pendingRefresh = PendingIntent.getBroadcast(
                context, 1, refreshIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_btn_refresh, pendingRefresh);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
