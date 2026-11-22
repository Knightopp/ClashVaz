package com.vazoclash.tracker.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import com.vazoclash.tracker.MainActivity;
import com.vazoclash.tracker.R;
import com.vazoclash.tracker.data.VillageDataStore;
import java.util.List;

public class UpgradesWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_REFRESH_WIDGET = "com.vazoclash.tracker.ACTION_REFRESH_WIDGET";

    private static final int[] ROW_IDS = {
        R.id.upgrade_row_1,
        R.id.upgrade_row_2,
        R.id.upgrade_row_3,
        R.id.upgrade_row_4,
        R.id.upgrade_row_5,
        R.id.upgrade_row_6
    };

    private static final int[] ICON_IDS = {
        R.id.upgrade_icon_1,
        R.id.upgrade_icon_2,
        R.id.upgrade_icon_3,
        R.id.upgrade_icon_4,
        R.id.upgrade_icon_5,
        R.id.upgrade_icon_6
    };

    private static final int[] TITLE_IDS = {
        R.id.upgrade_title_1,
        R.id.upgrade_title_2,
        R.id.upgrade_title_3,
        R.id.upgrade_title_4,
        R.id.upgrade_title_5,
        R.id.upgrade_title_6
    };

    private static final int[] TIMER_IDS = {
        R.id.upgrade_timer_1,
        R.id.upgrade_timer_2,
        R.id.upgrade_timer_3,
        R.id.upgrade_timer_4,
        R.id.upgrade_timer_5,
        R.id.upgrade_timer_6
    };

    private static final int[] PROGRESS_IDS = {
        R.id.upgrade_progress_1,
        R.id.upgrade_progress_2,
        R.id.upgrade_progress_3,
        R.id.upgrade_progress_4,
        R.id.upgrade_progress_5,
        R.id.upgrade_progress_6
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
        updateAppWidget(context, appWidgetManager, appWidgetId);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (ACTION_REFRESH_WIDGET.equals(action) ||
            AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(action) ||
            AppWidgetManager.ACTION_APPWIDGET_OPTIONS_CHANGED.equals(action)) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName name = new ComponentName(context, UpgradesWidgetProvider.class);
            int[] ids = manager.getAppWidgetIds(name);
            if (ids != null) {
                onUpdate(context, manager, ids);
            }
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_upgrades);

            // Responsive sizing based on user resizing
            Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
            int minHeight = options != null ? options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0) : 0;
            int minWidth = options != null ? options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0) : 0;

            int maxVisibleRows = 4;
            if (minHeight > 0) {
                if (minHeight < 110) {
                    maxVisibleRows = 2;
                } else if (minHeight >= 180) {
                    maxVisibleRows = 6;
                } else {
                    maxVisibleRows = 4;
                }
            }

            if (minWidth > 0 && minWidth < 220) {
                views.setViewVisibility(R.id.widget_village_sub, View.GONE);
                views.setViewVisibility(R.id.widget_th_badge, View.GONE);
            } else {
                views.setViewVisibility(R.id.widget_village_sub, View.VISIBLE);
                views.setViewVisibility(R.id.widget_th_badge, View.VISIBLE);
            }

            String playerName = VillageDataStore.getPlayerName(context);
            int thLevel = VillageDataStore.getTownHallLevel(context);
            int progress = VillageDataStore.getProgressPercent(context);
            int totalBuildings = VillageDataStore.getTotalBuildings(context);

            views.setTextViewText(R.id.widget_player_name, playerName);
            views.setTextViewText(R.id.widget_village_sub, "Town Hall " + thLevel + " • " + progress + "% (" + totalBuildings + "/142)");
            views.setTextViewText(R.id.widget_th_badge, "TH" + thLevel);

            List<VillageDataStore.UpgradeItem> upgrades = VillageDataStore.getActiveUpgrades(context);
            int iconSizePx = Math.max(48, Math.round(context.getResources().getDisplayMetrics().density * 22));

            if (upgrades.isEmpty()) {
                views.setViewVisibility(R.id.widget_empty_text, View.VISIBLE);
                views.setTextViewText(R.id.widget_empty_text, "All Builders Free! Village Running Smoothly");
                for (int rowId : ROW_IDS) {
                    views.setViewVisibility(rowId, View.GONE);
                }
                views.setViewVisibility(R.id.widget_footer_text, View.VISIBLE);
                views.setTextViewText(R.id.widget_footer_text, "Tap to open VazoClash");
            } else {
                views.setViewVisibility(R.id.widget_empty_text, View.GONE);

                for (int i = 0; i < ROW_IDS.length; i++) {
                    if (i < upgrades.size() && i < maxVisibleRows) {
                        VillageDataStore.UpgradeItem upg = upgrades.get(i);
                        views.setViewVisibility(ROW_IDS[i], View.VISIBLE);
                        views.setTextViewText(TITLE_IDS[i], upg.getDisplayTitle());
                        views.setTextViewText(TIMER_IDS[i], upg.getFormattedRemainingTime());
                        views.setProgressBar(PROGRESS_IDS[i], 100, upg.getProgressPercent(), false);

                        Bitmap iconBmp = WidgetAssetHelper.getUpgradeIconBitmap(context, upg, iconSizePx);
                        if (iconBmp != null) {
                            views.setImageViewBitmap(ICON_IDS[i], iconBmp);
                        } else {
                            views.setImageViewResource(ICON_IDS[i], R.drawable.ic_launcher);
                        }
                    } else {
                        views.setViewVisibility(ROW_IDS[i], View.GONE);
                    }
                }

                int extra = upgrades.size() - maxVisibleRows;
                views.setViewVisibility(R.id.widget_footer_text, View.VISIBLE);
                if (extra > 0) {
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
        } catch (Throwable t) {
            android.util.Log.e("UpgradesWidget", "Failed updating app widget ID " + appWidgetId, t);
        }
    }
}
