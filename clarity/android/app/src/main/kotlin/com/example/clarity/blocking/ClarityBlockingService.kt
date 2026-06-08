package com.example.clarity.blocking

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.content.SharedPreferences
import android.view.accessibility.AccessibilityEvent
import org.json.JSONArray

/**
 * Watches for foreground app changes. When a blocked app comes to the front,
 * launches BlockedOverlayActivity.
 *
 * Enabled via: Settings → Accessibility → Clarity → turn on
 * (User must grant manually — Android requirement.)
 */
class ClarityBlockingService : AccessibilityService() {

    private lateinit var prefs: SharedPreferences

    override fun onServiceConnected() {
        prefs = getSharedPreferences("clarity_blocking", MODE_PRIVATE)
        serviceInfo = AccessibilityServiceInfo().apply {
            eventTypes  = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags       = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 100
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return

        // Ignore system UI and our own app
        if (pkg == packageName || pkg == "com.android.systemui") return

        val blockedApps = loadBlockedApps()
        if (blockedApps.contains(pkg)) {
            launchOverlay(pkg)
        }
    }

    override fun onInterrupt() {}

    private fun loadBlockedApps(): Set<String> {
        val json = prefs.getString("blocked_packages", "[]") ?: "[]"
        val arr  = JSONArray(json)
        return (0 until arr.length()).map { arr.getString(it) }.toSet()
    }

    private fun launchOverlay(blockedPackage: String) {
        val intent = Intent(this, BlockedOverlayActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("blocked_package", blockedPackage)
            putExtra("strictness", prefs.getInt("strictness", 1))
        }
        startActivity(intent)
    }
}
