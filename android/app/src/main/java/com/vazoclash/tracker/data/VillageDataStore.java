package com.vazoclash.tracker.data;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class VillageDataStore {
    private static final String PREF_NAME = "vazoclash_prefs";
    private static final String KEY_PLAYER_NAME = "player_name";
    private static final String KEY_TAG = "player_tag";
    private static final String KEY_TH_LEVEL = "th_level";
    private static final String KEY_PROGRESS_PERCENT = "progress_percent";
    private static final String KEY_TOTAL_BUILDINGS = "total_buildings";
    private static final String KEY_UPGRADES_JSON = "upgrades_json";

    public static class UpgradeItem {
        public String name;
        public int currentLevel;
        public int targetLevel;
        public long timerSeconds;
        public long finishTimestampMs;

        public UpgradeItem(String name, int currentLevel, int targetLevel, long timerSeconds) {
            this.name = name;
            this.currentLevel = currentLevel;
            this.targetLevel = targetLevel;
            this.timerSeconds = timerSeconds;
            this.finishTimestampMs = System.currentTimeMillis() + (timerSeconds * 1000);
        }

        public String getFormattedRemainingTime() {
            long remainingSec = (finishTimestampMs - System.currentTimeMillis()) / 1000;
            if (remainingSec <= 0) return "Ready";
            long days = remainingSec / 86400;
            long hours = (remainingSec % 86400) / 3600;
            long mins = (remainingSec % 3600) / 60;
            if (days > 0) return days + "d " + hours + "h";
            if (hours > 0) return hours + "h " + mins + "m";
            return mins + "m";
        }

        public String getDisplayTitle() {
            String cleanName = name != null ? name : "Building";
            if (cleanName.startsWith("Structure #")) {
                String raw = cleanName.replace("Structure #", "").trim();
                if ("1000000".equals(raw)) cleanName = "Cannon";
                else if ("1000067".equals(raw) || "1000068".equals(raw)) cleanName = "Spell Tower";
                else if ("1000084".equals(raw)) cleanName = "Multi-Archer Tower";
            }
            return cleanName + " Lv " + currentLevel + " → Lv " + targetLevel;
        }
    }

    public static void saveProfileJson(Context context, String jsonStr) {
        try {
            JSONObject obj = new JSONObject(jsonStr);
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            if (obj.has("playerName")) editor.putString(KEY_PLAYER_NAME, obj.optString("playerName", "Chief ClashMaster"));
            if (obj.has("tag")) editor.putString(KEY_TAG, obj.optString("tag", "#LU8QU99L0"));
            if (obj.has("townHallLevel")) editor.putInt(KEY_TH_LEVEL, obj.optInt("townHallLevel", 18));
            if (obj.has("completionPercentage")) editor.putInt(KEY_PROGRESS_PERCENT, obj.optInt("completionPercentage", 91));
            if (obj.has("totalBuildings")) editor.putInt(KEY_TOTAL_BUILDINGS, obj.optInt("totalBuildings", 125));

            if (obj.has("activeUpgrades")) {
                JSONArray arr = obj.getJSONArray("activeUpgrades");
                JSONArray storedArr = new JSONArray();
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject u = arr.getJSONObject(i);
                    JSONObject item = new JSONObject();
                    item.put("name", u.optString("name", "Building"));
                    item.put("currentLevel", u.optInt("currentLevel", 1));
                    item.put("targetLevel", u.optInt("targetLevel", 2));
                    long sec = u.optLong("timerSeconds", 86400);
                    item.put("timerSeconds", sec);
                    item.put("finishTimestampMs", System.currentTimeMillis() + (sec * 1000));
                    storedArr.put(item);
                }
                editor.putString(KEY_UPGRADES_JSON, storedArr.toString());
            }
            editor.apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static String getPlayerName(Context context) {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                .getString(KEY_PLAYER_NAME, "Chief ClashMaster");
    }

    public static String getPlayerTag(Context context) {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                .getString(KEY_TAG, "#LU8QU99L0");
    }

    public static int getTownHallLevel(Context context) {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                .getInt(KEY_TH_LEVEL, 18);
    }

    public static int getProgressPercent(Context context) {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                .getInt(KEY_PROGRESS_PERCENT, 91);
    }

    public static int getTotalBuildings(Context context) {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
                .getInt(KEY_TOTAL_BUILDINGS, 125);
    }

    public static List<UpgradeItem> getActiveUpgrades(Context context) {
        List<UpgradeItem> list = new ArrayList<>();
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_UPGRADES_JSON, null);

        if (json != null) {
            try {
                JSONArray arr = new JSONArray(json);
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.getJSONObject(i);
                    UpgradeItem item = new UpgradeItem(
                            obj.getString("name"),
                            obj.getInt("currentLevel"),
                            obj.getInt("targetLevel"),
                            obj.getLong("timerSeconds")
                    );
                    item.finishTimestampMs = obj.optLong("finishTimestampMs", System.currentTimeMillis() + (item.timerSeconds * 1000));
                    list.add(item);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Return authentic default upgrades if empty
        if (list.isEmpty()) {
            list.add(new UpgradeItem("Cannon", 13, 14, 64200));            // 17h 50m
            list.add(new UpgradeItem("Spell Tower", 6, 7, 70140));         // 19h 29m
            list.add(new UpgradeItem("Multi-Archer Tower", 3, 4, 34200));   // 9h 30m
            list.add(new UpgradeItem("Cannon", 13, 14, 82860));            // 23h 1m
            list.add(new UpgradeItem("Cannon", 13, 14, 115200));           // 1d 8h
            list.add(new UpgradeItem("Spell Tower", 6, 7, 144000));        // 1d 16h
            list.add(new UpgradeItem("Multi-Archer Tower", 3, 4, 46860));   // 13h 1m
        }

        return list;
    }
}
