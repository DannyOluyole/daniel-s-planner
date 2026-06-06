import NetworkExtension
import Foundation

/**
 * ScreenGuardFilter — Network Extension (Content Filter Provider)
 *
 * This runs as a separate process on the device, outside the main app.
 * It intercepts DNS lookups and blocks domains from the shared blocklist.
 *
 * To use: Add this target to your Xcode project and enable the
 * content-filter-provider Network Extension entitlement.
 */
class FilterProvider: NEFilterDataProvider {

    private var blockedDomains: Set<String> = []

    override func startFilter(completionHandler: @escaping (Error?) -> Void) {
        loadBlocklist()
        // Listen for blocklist updates from the main app
        CFNotificationCenterAddObserver(
            CFNotificationCenterGetDarwinNotifyCenter(),
            Unmanaged.passRetained(self).toOpaque(),
            { _, observer, _, _, _ in
                guard let obs = observer else { return }
                let provider = Unmanaged<FilterProvider>.fromOpaque(obs).takeUnretainedValue()
                provider.loadBlocklist()
            },
            "com.screenguard.blocklist.updated" as CFString,
            nil,
            .deliverImmediately
        )
        completionHandler(nil)
    }

    override func stopFilter(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        completionHandler()
    }

    override func handleNewFlow(_ flow: NEFilterFlow) -> NEFilterNewFlowVerdict {
        guard let browserFlow = flow as? NEFilterBrowserFlow,
              let url = browserFlow.request?.url,
              let host = url.host else {
            return .allow()
        }
        if isBlocked(host) {
            return .drop()
        }
        return .allow()
    }

    // ── Helpers ──────────────────────────────────────────────────────────
    private func loadBlocklist() {
        let defaults = UserDefaults(suiteName: "group.com.screenguard.app")
        let domains = defaults?.stringArray(forKey: "blockedDomains") ?? []
        blockedDomains = Set(domains.flatMap { [$0, "www.\($0)"] }.map { $0.lowercased() })
    }

    private func isBlocked(_ host: String) -> Bool {
        let lower = host.lowercased()
        if blockedDomains.contains(lower) { return true }
        // Check subdomain: e.g. "cdn.pornhub.com" matched by "pornhub.com"
        for domain in blockedDomains {
            if lower.hasSuffix(".\(domain)") { return true }
        }
        return false
    }
}
