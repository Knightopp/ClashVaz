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
        public long durationSeconds;
        public long finishTimestampMs;
        public String imageUrl;
        public String category;
        public String type;

        public UpgradeItem(String name, int currentLevel, int targetLevel, long timerSeconds, long durationSeconds, long finishTimestampMs, String imageUrl, String category, String type) {
            this.name = name;
            this.currentLevel = currentLevel;
            this.targetLevel = targetLevel;
            this.timerSeconds = timerSeconds;
            this.durationSeconds = durationSeconds > 0 ? durationSeconds : (timerSeconds > 0 ? timerSeconds : 86400);
            this.finishTimestampMs = finishTimestampMs > 0 ? finishTimestampMs : (System.currentTimeMillis() + (this.timerSeconds * 1000));
            this.imageUrl = imageUrl != null ? imageUrl : "";
            this.category = category != null ? category : "Defense";
            this.type = type != null ? type : "builder";
        }

        public int getProgressPercent() {
            long now = System.currentTimeMillis();
            if (finishTimestampMs <= now) {
                return 100;
            }
            long remainingMs = finishTimestampMs - now;
            long totalMs = durationSeconds > 0 ? (durationSeconds * 1000) : (timerSeconds * 1000);
            if (totalMs <= 0) return 0;
            if (remainingMs >= totalMs) return 4;
            long elapsedMs = totalMs - remainingMs;
            int pct = (int) ((elapsedMs * 100) / totalMs);
            return Math.max(4, Math.min(100, pct));
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
            cleanName = cleanName.replace("(Hero)", "")
                                 .replace("(Laboratory)", "")
                                 .replace("(Pet House)", "")
                                 .trim();
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

            if (obj.has("playerName")) {
                editor.putString(KEY_PLAYER_NAME, obj.optString("playerName", "Chief ClashMaster"));
            } else if (obj.has("name")) {
                editor.putString(KEY_PLAYER_NAME, obj.optString("name", "Chief ClashMaster"));
            }
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
                    String uName = u.optString("name", "Building");
                    item.put("name", uName);
                    int curLvl = u.optInt("currentLevel", 1);
                    item.put("currentLevel", curLvl);
                    int tgtLvl = u.optInt("targetLevel", curLvl + 1);
                    item.put("targetLevel", tgtLvl);
                    long sec = u.optLong("timerSeconds", u.optLong("durationSeconds", u.optLong("timer", 0)));
                    item.put("timerSeconds", sec);
                    long durSec = u.optLong("durationSeconds", sec > 0 ? sec : 86400);
                    item.put("durationSeconds", durSec);
                    long finishTs = u.optLong("upgradeEndTimestamp", u.optLong("finishTimestampMs", System.currentTimeMillis() + (sec * 1000)));
                    item.put("finishTimestampMs", finishTs);

                    String imgUrl = "";
                    if (u.has("image")) {
                        Object imgObj = u.get("image");
                        if (imgObj instanceof JSONObject) {
                            imgUrl = ((JSONObject) imgObj).optString("url", "");
                        } else if (imgObj instanceof String) {
                            imgUrl = (String) imgObj;
                        }
                    }
                    if (imgUrl.isEmpty() && u.has("imageUrl")) {
                        imgUrl = u.optString("imageUrl", "");
                    }
                    item.put("imageUrl", imgUrl);
                    item.put("category", u.optString("category", "Defense"));
                    item.put("type", u.optString("type", "builder"));

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
                    String name = obj.getString("name");
                    int cur = obj.getInt("currentLevel");
                    int tgt = obj.getInt("targetLevel");
                    long timer = obj.getLong("timerSeconds");
                    long dur = obj.optLong("durationSeconds", timer);
                    long finish = obj.optLong("finishTimestampMs", System.currentTimeMillis() + (timer * 1000));
                    String img = obj.optString("imageUrl", "");
                    String cat = obj.optString("category", "Defense");
                    String type = obj.optString("type", "builder");

                    list.add(new UpgradeItem(name, cur, tgt, timer, dur, finish, img, cat, type));
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return list;
    }
}
