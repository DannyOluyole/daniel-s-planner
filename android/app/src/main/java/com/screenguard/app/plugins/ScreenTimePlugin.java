package com.screenguard.app.plugins;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Calendar;
import java.util.List;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;

@CapacitorPlugin(name = "ScreenTime")
public class ScreenTimePlugin extends Plugin {

    @PluginMethod
    public void hasPermission(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", isUsageStatsPermissionGranted());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (!isUsageStatsPermissionGranted()) {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getTodayUsage(PluginCall call) {
        if (!isUsageStatsPermissionGranted()) {
            call.reject("PERMISSION_DENIED", "Usage stats permission required");
            return;
        }
        UsageStatsManager usm = (UsageStatsManager) getContext()
                .getSystemService(Context.USAGE_STATS_SERVICE);

        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        long startTime = cal.getTimeInMillis();
        long endTime = System.currentTimeMillis();

        Map<String, UsageStats> statsMap = usm.queryAndAggregateUsageStats(startTime, endTime);

        JSArray apps = new JSArray();
        long totalMs = 0;

        // Sort by usage descending
        SortedMap<Long, UsageStats> sorted = new TreeMap<>();
        for (UsageStats us : statsMap.values()) {
            if (us.getTotalTimeInForeground() > 0) {
                sorted.put(us.getTotalTimeInForeground(), us);
            }
        }

        for (Map.Entry<Long, UsageStats> entry : sorted.entrySet()) {
            UsageStats us = entry.getValue();
            long ms = us.getTotalTimeInForeground();
            totalMs += ms;
            JSObject app = new JSObject();
            app.put("packageName", us.getPackageName());
            app.put("appName", getAppLabel(us.getPackageName()));
            app.put("minutes", ms / 60000);
            app.put("seconds", (ms / 1000) % 60);
            apps.put(app);
        }

        JSObject ret = new JSObject();
        ret.put("totalMinutes", totalMs / 60000);
        ret.put("apps", apps);
        call.resolve(ret);
    }

    @PluginMethod
    public void getWeeklyUsage(PluginCall call) {
        if (!isUsageStatsPermissionGranted()) {
            call.reject("PERMISSION_DENIED", "Usage stats permission required");
            return;
        }
        UsageStatsManager usm = (UsageStatsManager) getContext()
                .getSystemService(Context.USAGE_STATS_SERVICE);

        JSArray days = new JSArray();
        for (int i = 6; i >= 0; i--) {
            Calendar start = Calendar.getInstance();
            start.add(Calendar.DAY_OF_YEAR, -i);
            start.set(Calendar.HOUR_OF_DAY, 0);
            start.set(Calendar.MINUTE, 0);
            start.set(Calendar.SECOND, 0);
            start.set(Calendar.MILLISECOND, 0);

            Calendar end = (Calendar) start.clone();
            end.set(Calendar.HOUR_OF_DAY, 23);
            end.set(Calendar.MINUTE, 59);
            end.set(Calendar.SECOND, 59);

            Map<String, UsageStats> statsMap = usm.queryAndAggregateUsageStats(
                    start.getTimeInMillis(), end.getTimeInMillis());

            long totalMs = 0;
            for (UsageStats us : statsMap.values()) {
                totalMs += us.getTotalTimeInForeground();
            }

            JSObject day = new JSObject();
            day.put("date", String.format("%tF", start));
            day.put("totalMinutes", totalMs / 60000);
            days.put(day);
        }

        JSObject ret = new JSObject();
        ret.put("days", days);
        call.resolve(ret);
    }

    private boolean isUsageStatsPermissionGranted() {
        AppOpsManager appOps = (AppOpsManager) getContext()
                .getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                getContext().getPackageName()
        );
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    private String getAppLabel(String packageName) {
        try {
            android.content.pm.PackageManager pm = getContext().getPackageManager();
            android.content.pm.ApplicationInfo info = pm.getApplicationInfo(packageName, 0);
            return (String) pm.getApplicationLabel(info);
        } catch (Exception e) {
            return packageName;
        }
    }
}
