/**
 * Schedule Notification Engine
 * Supports Browser Native Notifications, Audio Chimes, and In-App Schedule Reminders
 */

// Soft polite study bell chime using Web Audio API (no external audio assets required)
export function playStudyChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Play tone 1 (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);

    // Play tone 2 (880 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 1.2);
  } catch (err) {
    // Audio context may be blocked before first user gesture
  }
}

// Request Browser Native Notification Permission
export async function requestScheduleNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    localStorage.setItem('cogniflow_schedule_notif_enabled', 'true');
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('cogniflow_schedule_notif_enabled', 'true');
    }
    return permission;
  } catch (e) {
    return 'denied';
  }
}

// Check if user has enabled notifications
export function isScheduleNotificationEnabled() {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted' && localStorage.getItem('cogniflow_schedule_notif_enabled') !== 'false';
}

// Dispatch a schedule alert (Browser Notification + Audio Chime)
export function dispatchScheduleAlert(title, message, options = {}) {
  // Play subtle study chime
  playStudyChime();

  // If browser notification is granted, show native desktop notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || 'study-schedule-reminder',
        renotify: true,
        ...options
      });

      notif.onclick = () => {
        window.focus();
        if (options.onClick) options.onClick();
        notif.close();
      };

      return notif;
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  }

  return null;
}
