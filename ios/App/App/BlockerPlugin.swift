import Foundation
import Capacitor
import NetworkExtension

/**
 * BlockerPlugin — iOS
 *
 * Website blocking on iOS uses NEContentFilterManager (Network Extension).
 * This requires:
 *   1. The "com.apple.developer.networking.networkextension" entitlement (content-filter-provider)
 *   2. A separate Network Extension app target in Xcode
 *   3. App Store review approval (Apple reviews NE apps carefully)
 *
 * This plugin sets up the managed filter configuration and starts the extension.
 * The actual DNS filtering runs in the separate ScreenGuardFilterProvider target.
 *
 * Setup steps (done in Xcode):
 *   1. Add a new target: File → New → Target → Network Extension
 *   2. Name it "ScreenGuardFilter"
 *   3. Set provider type to "DNS Proxy" or "Content Filter"
 *   4. Add entitlement: com.apple.developer.networking.networkextension → content-filter-provider
 */
@objc(BlockerPlugin)
public class BlockerPlugin: CAPPlugin {

    private var filterManager: NEFilterManager?

    override public func load() {
        NEFilterManager.shared().loadFromPreferences { [weak self] error in
            self?.filterManager = NEFilterManager.shared()
        }
    }

    @objc func isVpnPermissionGranted(_ call: CAPPluginCall) {
        NEFilterManager.shared().loadFromPreferences { error in
            let granted = NEFilterManager.shared().isEnabled
            call.resolve(["granted": granted])
        }
    }

    @objc func requestVpnPermission(_ call: CAPPluginCall) {
        let manager = NEFilterManager.shared()
        manager.loadFromPreferences { error in
            if error != nil {
                call.reject("LOAD_FAILED", error!.localizedDescription)
                return
            }

            if manager.providerConfiguration == nil {
                let config = NEFilterProviderConfiguration()
                config.username = "ScreenGuard"
                config.organization = "ScreenGuard"
                config.filterBrowsers = true
                config.filterSockets = true
                manager.providerConfiguration = config
            }

            manager.isEnabled = true
            manager.saveToPreferences { saveError in
                if let saveError = saveError {
                    call.reject("SAVE_FAILED", saveError.localizedDescription)
                } else {
                    call.resolve(["granted": true])
                }
            }
        }
    }

    @objc func startBlocking(_ call: CAPPluginCall) {
        guard let domains = call.getArray("domains", String.self) else {
            call.reject("INVALID_ARGS", "domains array required")
            return
        }

        // Store blocklist in shared UserDefaults (App Group) so the
        // Network Extension can read it
        let defaults = UserDefaults(suiteName: "group.com.screenguard.app")
        defaults?.set(domains, forKey: "blockedDomains")
        defaults?.synchronize()

        let manager = NEFilterManager.shared()
        manager.loadFromPreferences { error in
            manager.isEnabled = true
            manager.saveToPreferences { saveError in
                if let err = saveError {
                    call.reject("SAVE_FAILED", err.localizedDescription)
                } else {
                    call.resolve(["started": true, "blockedCount": domains.count])
                }
            }
        }
    }

    @objc func stopBlocking(_ call: CAPPluginCall) {
        let manager = NEFilterManager.shared()
        manager.loadFromPreferences { error in
            manager.isEnabled = false
            manager.saveToPreferences { saveError in
                if let err = saveError {
                    call.reject("SAVE_FAILED", err.localizedDescription)
                } else {
                    call.resolve(["stopped": true])
                }
            }
        }
    }

    @objc func isBlocking(_ call: CAPPluginCall) {
        NEFilterManager.shared().loadFromPreferences { error in
            call.resolve(["active": NEFilterManager.shared().isEnabled])
        }
    }

    @objc func updateBlocklist(_ call: CAPPluginCall) {
        guard let domains = call.getArray("domains", String.self) else {
            call.reject("INVALID_ARGS", "domains array required")
            return
        }
        let defaults = UserDefaults(suiteName: "group.com.screenguard.app")
        defaults?.set(domains, forKey: "blockedDomains")
        defaults?.synchronize()
        // Trigger extension reload via notification
        CFNotificationCenterPostNotification(
            CFNotificationCenterGetDarwinNotifyCenter(),
            CFNotificationName("com.screenguard.blocklist.updated" as CFString),
            nil, nil, true
        )
        call.resolve(["updated": true, "count": domains.count])
    }
}
