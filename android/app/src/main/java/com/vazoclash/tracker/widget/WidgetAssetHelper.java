package com.vazoclash.tracker.widget;

import android.content.Context;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.util.Log;
import com.vazoclash.tracker.data.VillageDataStore;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class WidgetAssetHelper {
    private static final String TAG = "WidgetAssetHelper";
    private static final Map<String, String[]> FOLDER_CACHE = new HashMap<>();

    public static Bitmap getUpgradeIconBitmap(Context context, VillageDataStore.UpgradeItem item, int targetSizePx) {
        if (context == null || item == null) return null;

        // 1. Try explicit imageUrl from VillageDataStore
        if (item.imageUrl != null && !item.imageUrl.isEmpty()) {
            String clean = item.imageUrl.trim();
            if (clean.startsWith("/")) clean = clean.substring(1);
            if (!clean.contains("Town_Hall18.png") && !clean.contains("Cannon_Home_Village/level-1.png")) {
                Bitmap bmp = loadAndScaleAsset(context, clean, targetSizePx);
                if (bmp != null) return bmp;
            }
        }

        // 2. Resolve fallback based on name, targetLevel, and category
        String fallbackPath = resolveFallbackPath(context, item.name, item.targetLevel, item.category, item.type);
        if (fallbackPath != null) {
            Bitmap bmp = loadAndScaleAsset(context, fallbackPath, targetSizePx);
            if (bmp != null) return bmp;
        }

        return null;
    }

    private static String resolveFallbackPath(Context context, String rawName, int targetLvl, String category, String type) {
        if (rawName == null) return null;
        String name = rawName.toLowerCase(Locale.US).trim();

        // Clean name
        name = name.replace("(hero)", "")
                   .replace("(laboratory)", "")
                   .replace("(pet house)", "")
                   .replace("(defense)", "")
                   .trim();

        // Heroes
        if (name.contains("barbarian king")) return "downloads/images/Heroes/barbarian_king.webp";
        if (name.contains("archer queen")) return "downloads/images/Heroes/archer_queen.webp";
        if (name.contains("grand warden")) return "downloads/images/Heroes/grand_warden.webp";
        if (name.contains("royal champion")) return "downloads/images/Heroes/royal_champion.webp";
        if (name.contains("minion prince")) return "downloads/images/Heroes/minion_prince.webp";
        if (name.contains("dragon duke")) return "downloads/images/Heroes/dragon_duke.webp";

        // Pets
        if (name.contains("spirit fox") || name.contains("fox")) return "downloads/images/pets/spirit_fox.webp";
        if (name.contains("diggy")) return "downloads/images/pets/diggy.webp";
        if (name.contains("frosty")) return "downloads/images/pets/frosty.webp";
        if (name.contains("phoenix")) return "downloads/images/pets/phoenix.webp";
        if (name.contains("electro owl") || name.contains("owl")) return "downloads/images/pets/electro_owl.webp";
        if (name.contains("lassi") || name.contains("l.a.s.s.i")) return "downloads/images/pets/lassi.webp";
        if (name.contains("unicorn")) return "downloads/images/pets/unicorn.webp";
        if (name.contains("mighty yak") || name.contains("yak")) return "downloads/images/pets/mighty_yak.webp";
        if (name.contains("angry jelly") || name.contains("jelly")) return "downloads/images/pets/angry_jelly.webp";
        if (name.contains("poison lizard") || name.contains("lizard")) return "downloads/images/pets/poison_lizard.webp";

        // Spells
        if (name.contains("lightning")) return "downloads/images/spells/lightning_spell.webp";
        if (name.contains("heal")) return "downloads/images/spells/healing_spell.webp";
        if (name.contains("rage")) return "downloads/images/spells/rage_spell.webp";
        if (name.contains("jump")) return "downloads/images/spells/jump_spell.webp";
        if (name.contains("freeze")) return "downloads/images/spells/freeze_spell.webp";
        if (name.contains("clone")) return "downloads/images/spells/clone_spell.webp";
        if (name.contains("invis")) return "downloads/images/spells/invisibility_spell.webp";
        if (name.contains("recall")) return "downloads/images/spells/recall_spell.webp";
        if (name.contains("overgrowth")) return "downloads/images/spells/overgrowth_spell.webp";
        if (name.contains("poison")) return "downloads/images/spells/poison_spell.webp";
        if (name.contains("earthquake")) return "downloads/images/spells/earthquake_spell.webp";
        if (name.contains("haste")) return "downloads/images/spells/haste_spell.webp";
        if (name.contains("skeleton")) return "downloads/images/spells/skeleton_spell.webp";
        if (name.contains("bat")) return "downloads/images/spells/bat_spell.webp";

        // Troops
        if (name.contains("ice golem")) return "downloads/images/troops/ice_golem.webp";
        if (name.contains("electro dragon") || name.contains("edrag")) return "downloads/images/troops/electro_dragon.webp";
        if (name.contains("dragon rider")) return "downloads/images/troops/dragon_rider.webp";
        if (name.contains("electro titan")) return "downloads/images/troops/electro_titan.webp";
        if (name.contains("root rider")) return "downloads/images/troops/root_rider.webp";
        if (name.contains("super barbarian")) return "downloads/images/troops/super_barbarian.webp";
        if (name.contains("barbarian") && !name.contains("king")) return "downloads/images/troops/barbarian.webp";
        if (name.contains("archer") && !name.contains("queen") && !name.contains("tower")) return "downloads/images/troops/archer.webp";
        if (name.contains("giant")) return "downloads/images/troops/giant.webp";
        if (name.contains("goblin")) return "downloads/images/troops/goblin.webp";
        if (name.contains("wall breaker")) return "downloads/images/troops/wall_breaker.webp";
        if (name.contains("balloon")) return "downloads/images/troops/balloon.webp";
        if (name.contains("wizard") && !name.contains("tower")) return "downloads/images/troops/wizard.webp";
        if (name.contains("healer")) return "downloads/images/troops/healer.webp";
        if (name.contains("dragon") && !name.contains("rider") && !name.contains("duke")) return "downloads/images/troops/dragon.webp";
        if (name.contains("pekka") || name.contains("p.e.k.k.a")) return "downloads/images/troops/pekka.webp";
        if (name.contains("baby dragon")) return "downloads/images/troops/baby_dragon.webp";
        if (name.contains("miner")) return "downloads/images/troops/miner.webp";
        if (name.contains("yeti")) return "downloads/images/troops/yeti.webp";
        if (name.contains("apprentice warden")) return "downloads/images/troops/apprentice_warden.webp";
        if (name.contains("minion") && !name.contains("prince")) return "downloads/images/troops/minion.webp";
        if (name.contains("hog rider")) return "downloads/images/troops/hog_rider.webp";
        if (name.contains("valkyrie")) return "downloads/images/troops/valkyrie.webp";
        if (name.contains("golem") && !name.contains("ice")) return "downloads/images/troops/golem.webp";
        if (name.contains("witch")) return "downloads/images/troops/witch.webp";
        if (name.contains("lava hound")) return "downloads/images/troops/lava_hound.webp";
        if (name.contains("bowler")) return "downloads/images/troops/bowler.webp";
        if (name.contains("headhunter")) return "downloads/images/troops/headhunter.webp";

        // Buildings Folder Mapping
        String folder = null;
        if (name.contains("multi-archer")) folder = "Multi-Archer_Tower";
        else if (name.contains("ricochet")) folder = "Ricochet_Cannon";
        else if (name.contains("air def")) folder = "Air_Defense";
        else if (name.contains("air sweep")) folder = "Air_Sweeper";
        else if (name.contains("wizard tower")) folder = "Wizard_Tower";
        else if (name.contains("super wizard")) folder = "Super_Wizard_Tower";
        else if (name.contains("archer tower")) folder = "Archer_Tower_Home_Village";
        else if (name.contains("cannon")) folder = "Cannon_Home_Village";
        else if (name.contains("mortar")) folder = "Mortar";
        else if (name.contains("tesla")) folder = "Hidden_Tesla_Home_Village";
        else if (name.contains("bomb tower")) folder = "Bomb_Tower";
        else if (name.contains("x-bow") || name.contains("xbow")) folder = "X-Bow_Home_Village";
        else if (name.contains("inferno")) folder = "Inferno_Tower_Home_Village";
        else if (name.contains("eagle")) folder = "Eagle_Artillery";
        else if (name.contains("scatter")) folder = "Scattershot";
        else if (name.contains("spell tower")) folder = "Spell_Tower";
        else if (name.contains("monolith")) folder = "Monolith";
        else if (name.contains("firespitter")) folder = "Firespitter";
        else if (name.contains("spiky")) folder = "Spiky_Tower";
        else if (name.contains("firecracker")) folder = "Firecracker_Tower";
        else if (name.contains("squad")) folder = "Squad_Barracks";
        else if (name.contains("army camp")) folder = "Army_Camp_Home_Village";
        else if (name.contains("gold stor")) folder = "Gold_Storage_Home_Village";
        else if (name.contains("elixir stor")) folder = "Elixir_Storage_Home_Village";
        else if (name.contains("dark elixir stor")) folder = "Dark_Elixir_Storage";
        else if (name.contains("gold mine")) folder = "Gold_Mine_Home_Village";
        else if (name.contains("elixir coll")) folder = "Elixir_Collector_Home_Village";
        else if (name.contains("dark elixir drill")) folder = "Dark_Elixir_Drill";
        else if (name.contains("clan castle")) folder = "Clan_Castle";
        else if (name.contains("town hall")) folder = "Town_Hall";
        else if (name.contains("pet house")) folder = "Pet_House";
        else if (name.contains("lab")) folder = "Laboratory";
        else if (name.contains("blacksmith")) folder = "Blacksmith";
        else if (name.contains("workshop")) folder = "Workshop";
        else if (name.contains("dark barrack")) folder = "Dark_Barracks";
        else if (name.contains("barrack")) folder = "Barracks";
        else if (name.contains("dark spell")) folder = "Dark_Spell_Factory";
        else if (name.contains("spell fact")) folder = "Spell_Factory";
        else if (name.contains("builder")) folder = "Builder's_Hut";

        if (folder != null) {
            String bestFile = findClosestLevelFile(context, folder, targetLvl);
            if (bestFile != null) {
                return "downloads/images/" + folder + "/" + bestFile;
            }
        }

        return null;
    }

    private static String findClosestLevelFile(Context context, String folder, int targetLvl) {
        try {
            AssetManager am = context.getAssets();
            String dir = "downloads/images/" + folder;
            String[] files = FOLDER_CACHE.get(dir);
            if (files == null) {
                files = am.list(dir);
                if (files != null) FOLDER_CACHE.put(dir, files);
            }
            if (files == null || files.length == 0) return null;

            Pattern p = Pattern.compile("level-(\\d+)\\.png");
            String closestFile = null;
            int minDiff = Integer.MAX_VALUE;

            for (String f : files) {
                Matcher m = p.matcher(f);
                if (m.find()) {
                    int lvl = Integer.parseInt(m.group(1));
                    int diff = Math.abs(lvl - targetLvl);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestFile = f;
                    }
                }
            }
            return closestFile != null ? closestFile : files[0];
        } catch (Exception e) {
            Log.w(TAG, "Failed listing files for folder " + folder, e);
            return null;
        }
    }

    private static Bitmap loadAndScaleAsset(Context context, String path, int targetSizePx) {
        try {
            InputStream is = context.getAssets().open(path);
            Bitmap raw = BitmapFactory.decodeStream(is);
            is.close();
            if (raw == null) return null;

            Bitmap scaled = Bitmap.createScaledBitmap(raw, targetSizePx, targetSizePx, true);
            if (scaled != raw) {
                raw.recycle();
            }

            int radius = Math.max(4, Math.round(targetSizePx * 0.15f));
            return getRoundedBitmap(scaled, radius);
        } catch (Exception e) {
            return null;
        }
    }

    public static Bitmap getRoundedBitmap(Bitmap bitmap, int cornerRadiusPx) {
        if (bitmap == null) return null;
        try {
            Bitmap output = Bitmap.createBitmap(bitmap.getWidth(), bitmap.getHeight(), Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(output);
            Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            Rect rect = new Rect(0, 0, bitmap.getWidth(), bitmap.getHeight());
            RectF rectF = new RectF(rect);
            canvas.drawRoundRect(rectF, cornerRadiusPx, cornerRadiusPx, paint);
            paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
            canvas.drawBitmap(bitmap, rect, rect, paint);
            bitmap.recycle();
            return output;
        } catch (Throwable t) {
            return bitmap;
        }
    }
}
