import Foundation
import Capacitor

/**
 * ScreenTimePlugin — iOS
 *
 * iOS does NOT allow third-party apps to read system-wide screen time via a public API.
 * Apple's Screen Time API (DeviceActivityMonitor) requires a special entitlement
 * (com.apple.developer.family-controls) that must be requested from Apple and is
 * only granted to parental control / family safety apps.
 *
 * This plugin returns a clear explanation and opens the native Settings → Screen Time
 * screen so users can check manually, while still exposing a consistent API surface
 * that matches the Android plugin.
 *
 * When/if your app is approved for the family-controls entitlement, replace the
 * stubs below with DeviceActivityMonitor + ManagedSettings implementations.
 */
@objc(ScreenTimePlugin)
public class ScreenTimePlugin: CAPPlugin {

    @objc func hasPermission(_ call: CAPPluginCall) {
        // On iOS we can't programmatically check; assume not available
        call.resolve(["granted": false, "platform": "ios",
                      "note": "iOS requires Screen Time API entitlement from Apple"])
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        // Open Settings → Screen Time for the user to check manually
        DispatchQueue.main.async {
            if let url = URL(string: "App-prefs:SCREEN_TIME") {
                UIApplication.shared.open(url, options: [:], completionHandler: nil)
            }
        }
        call.resolve(["opened": true,
                      "note": "Opened iOS Screen Time settings. Full API requires Apple entitlement."])
    }

    @objc func getTodayUsage(_ call: CAPPluginCall) {
        call.resolve([
            "totalMinutes": 0,
            "apps": [],
            "error": "iOS Screen Time API requires special Apple entitlement (com.apple.developer.family-controls). Apply at developer.apple.com/contact/request/family-controls-distribution"
        ])
    }

    @objc func getWeeklyUsage(_ call: CAPPluginCall) {
        call.resolve(["days": [], "error": "Requires Apple family-controls entitlement"])
    }
}
