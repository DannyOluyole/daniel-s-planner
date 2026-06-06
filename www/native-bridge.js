/**
 * native-bridge.js
 * Bridges the ScreenGuard web app to Capacitor native plugins.
 * Falls back gracefully in the browser (no-op stubs).
 */

const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

// ── Lazy plugin getter ────────────────────────────────────────────────────
function getPlugin(name) {
  if (!isNative) return null;
  return window.Capacitor.Plugins[name] || null;
}

// ── SCREEN TIME ───────────────────────────────────────────────────────────
export const ScreenTime = {
  async hasPermission() {
    const p = getPlugin('ScreenTime');
    if (!p) return { granted: false };
    return p.hasPermission();
  },

  async requestPermission() {
    const p = getPlugin('ScreenTime');
    if (!p) return { opened: false };
    return p.requestPermission();
  },

  async getTodayUsage() {
    const p = getPlugin('ScreenTime');
    if (!p) return { totalMinutes: 0, apps: [] };
    return p.getTodayUsage();
  },

  async getWeeklyUsage() {
    const p = getPlugin('ScreenTime');
    if (!p) return { days: [] };
    return p.getWeeklyUsage();
  },
};

// ── BLOCKER ───────────────────────────────────────────────────────────────
export const Blocker = {
  async isVpnPermissionGranted() {
    const p = getPlugin('Blocker');
    if (!p) return { granted: false };
    return p.isVpnPermissionGranted();
  },

  async requestVpnPermission() {
    const p = getPlugin('Blocker');
    if (!p) return { granted: false };
    return p.requestVpnPermission();
  },

  async startBlocking(domains) {
    const p = getPlugin('Blocker');
    if (!p) { console.log('[ScreenGuard] Blocker not available — web mode'); return { started: false }; }
    return p.startBlocking({ domains });
  },

  async stopBlocking() {
    const p = getPlugin('Blocker');
    if (!p) return { stopped: false };
    return p.stopBlocking();
  },

  async isBlocking() {
    const p = getPlugin('Blocker');
    if (!p) return { active: false };
    return p.isBlocking();
  },

  async updateBlocklist(domains) {
    const p = getPlugin('Blocker');
    if (!p) return { updated: false };
    return p.updateBlocklist({ domains });
  },
};

// ── LOCAL NOTIFICATIONS ───────────────────────────────────────────────────
export const Notify = {
  async requestPermission() {
    if (!isNative && !('Notification' in window)) return { display: 'denied' };
    if (!isNative) {
      const perm = await Notification.requestPermission();
      return { display: perm };
    }
    const p = getPlugin('LocalNotifications');
    if (!p) return { display: 'denied' };
    return p.requestPermissions();
  },

  async scheduleDaily(id, title, body, hour, minute) {
    if (!isNative) {
      console.log(`[ScreenGuard] Notify stub: ${title} at ${hour}:${minute}`);
      return;
    }
    const p = getPlugin('LocalNotifications');
    if (!p) return;
    return p.schedule({
      notifications: [{
        id,
        title,
        body,
        schedule: {
          on: { hour, minute },
          repeats: true,
          every: 'day',
        },
        sound: 'default',
        smallIcon: 'ic_notification',
      }]
    });
  },

  async sendNow(id, title, body) {
    if (!isNative) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }
    const p = getPlugin('LocalNotifications');
    if (!p) return;
    return p.schedule({
      notifications: [{
        id,
        title,
        body,
        schedule: { at: new Date(Date.now() + 500) },
        sound: 'default',
        smallIcon: 'ic_notification',
      }]
    });
  },

  async cancel(id) {
    if (!isNative) return;
    const p = getPlugin('LocalNotifications');
    if (!p) return;
    return p.cancel({ notifications: [{ id }] });
  },
};

// ── HAPTICS ───────────────────────────────────────────────────────────────
export const Haptics = {
  async impact(style = 'medium') {
    if (!isNative) return;
    const p = getPlugin('Haptics');
    if (!p) return;
    return p.impact({ style });
  },

  async notification(type = 'success') {
    if (!isNative) return;
    const p = getPlugin('Haptics');
    if (!p) return;
    return p.notification({ type });
  },
};

// ── APP LIFECYCLE ─────────────────────────────────────────────────────────
export function onAppResume(callback) {
  if (!isNative) return;
  const p = getPlugin('App');
  if (!p) return;
  p.addListener('appStateChange', (state) => {
    if (state.isActive) callback();
  });
}

export function onAppPause(callback) {
  if (!isNative) return;
  const p = getPlugin('App');
  if (!p) return;
  p.addListener('appStateChange', (state) => {
    if (!state.isActive) callback();
  });
}

export { isNative };
