package com.clarity.app.blocking

import android.content.Context
import android.content.SharedPreferences
import android.provider.Settings
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Counts notifications received per app, per day. Requires the user to grant
 * notification access (Settings → Apps → Special app access → Notification access),
 * separate from usage-stats access.
 *
 * Counts only accumulate from the moment access is granted onward — Android does
 * not expose historical notification logs.
 */
class NotificationCounterService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val pkg = sbn.packageName
        if (pkg == packageName) return
        val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
        val day   = dayKey(System.currentTimeMillis())
        val key   = "$day|$pkg"
        val current = prefs.getInt(key, 0)
        prefs.edit().putInt(key, current + 1).apply()
    }

    companion object {
        private const val PREFS = "clarity_notifications"

        fun hasAccess(context: Context): Boolean {
            val enabled = Settings.Secure.getString(
                context.contentResolver, "enabled_notification_listeners"
            ) ?: return false
            return enabled.contains(context.packageName)
        }

        /** Returns { packageName, appName, notifications } for the given day, sorted descending. */
        fun getCountsForDay(context: Context, dayMillis: Long): JSONArray {
            val prefs = context.getSharedPreferences(PREFS, MODE_PRIVATE)
            val pm    = context.packageManager
            val day   = dayKey(dayMillis)
            val prefix = "$day|"

            val result = JSONArray()
            prefs.all.entries
                .filter { it.key.startsWith(prefix) }
                .map { it.key.removePrefix(prefix) to (it.value as? Int ?: 0) }
                .filter { it.second > 0 }
                .sortedByDescending { it.second }
                .forEach { (pkg, count) ->
                    val label = try {
                        pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
                    } catch (_: Exception) { pkg }

                    result.put(JSONObject().apply {
                        put("packageName",    pkg)
                        put("appName",        label)
                        put("notifications",  count)
                    })
                }
            return result
        }

        /** Returns 7 entries { dateMillis, value } — total notifications per day, oldest first. */
        fun getDailyTotals(context: Context, days: Int = 7): JSONArray {
            val prefs = context.getSharedPreferences(PREFS, MODE_PRIVATE)
            val result = JSONArray()
            val cal = Calendar.getInstance()

            for (i in (days - 1) downTo 0) {
                val dayCal = cal.clone() as Calendar
                dayCal.add(Calendar.DAY_OF_YEAR, -i)
                val day = dayKey(dayCal.timeInMillis)
                val prefix = "$day|"
                val total = prefs.all.entries
                    .filter { it.key.startsWith(prefix) }
                    .sumOf { (it.value as? Int ?: 0) }

                result.put(JSONObject().apply {
                    put("dateMillis", dayCal.timeInMillis)
                    put("value", total)
                })
            }
            return result
        }

        private fun dayKey(millis: Long): String =
            SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(millis))
    }
}
