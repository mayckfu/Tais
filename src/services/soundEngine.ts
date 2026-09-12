// Sound & Haptic Alert Engine for Duty Nurses and Hospital Personnel
// Synthesizes pleasant clinical acoustic chimes using the standard Web Audio API (no external MP3 dependencies)

export type SoundType = 'dispatch' | 'urgent' | 'success' | 'warning' | 'info';

export interface NotificationSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  nativePushEnabled: boolean;
  volume: number; // 0.0 to 1.0
}

const SETTINGS_KEY = 'hospital_deficit_notification_prefs_v1';

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    soundEnabled: true,
    hapticEnabled: true,
    nativePushEnabled: true,
    volume: 0.8,
  };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;

    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioCtxClass();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Play synthesized medical/hospital acoustic chimes
 */
export function playHospitalChime(type: SoundType = 'dispatch', customVolume?: number): boolean {
  const prefs = getNotificationSettings();
  if (!prefs.soundEnabled && customVolume === undefined) {
    return false;
  }

  const volume = customVolume !== undefined ? customVolume : prefs.volume;
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    const now = ctx.currentTime;

    if (type === 'dispatch') {
      // 3-tone ascending alert: F5 (698.46Hz) -> A5 (880Hz) -> C6 (1046.5Hz)
      // Distinctive hospital call chime indicating arrival or relocation authorization
      const notes = [698.46, 880.0, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.16);

        const startTime = now + idx * 0.16;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.3 * volume, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
      return true;
    }

    if (type === 'urgent') {
      // 4-tone urgent paging: High-contrast pulsing chime
      const freqs = [880.0, 1174.66, 880.0, 1174.66];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        const startTime = now + idx * 0.12;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.35 * volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
      return true;
    }

    if (type === 'success') {
      // 2-tone melodic confirmation: G5 (783.99Hz) -> C6 (1046.5Hz)
      const freqs = [783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        const startTime = now + idx * 0.18;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.25 * volume, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.65);
      });
      return true;
    }

    if (type === 'warning') {
      // 2-tone cautionary descending alert: A5 (880Hz) -> F5 (698.46Hz)
      const freqs = [880.0, 698.46];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        // filter for warmth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);

        osc.frequency.setValueAtTime(freq, now + idx * 0.2);

        const startTime = now + idx * 0.2;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.2 * volume, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
      return true;
    }

    // Default info chime: single pure bell tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.25 * volume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);

    return true;
  } catch (e) {
    console.warn('Audio chime playback failed:', e);
    return false;
  }
}

/**
 * Trigger mobile haptic pulse vibration
 */
export function triggerHapticAlert(pattern: number[] = [150, 75, 150, 75, 250]): boolean {
  const prefs = getNotificationSettings();
  if (!prefs.hapticEnabled) return false;

  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      return navigator.vibrate(pattern);
    }
  } catch {
    // Ignore unsupported
  }
  return false;
}

/**
 * Check and request browser Web Notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Send native system push notification
 */
export function sendNativePushNotification(title: string, body: string, tag?: string): boolean {
  const prefs = getNotificationSettings();
  if (!prefs.nativePushEnabled) return false;

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        tag: tag || 'hospital-alert',
        icon: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=96&h=96&fit=crop&crop=faces',
      });
      return true;
    } catch (e) {
      console.warn('Native notification dispatch failed:', e);
      return false;
    }
  }
  return false;
}

/**
 * Complete multi-modal notification trigger (Acoustic Chime + Haptic Vibration + Native Push)
 */
export function triggerFullAlert(
  sound: SoundType,
  title: string,
  message: string,
  tag?: string
): void {
  playHospitalChime(sound);
  triggerHapticAlert(sound === 'urgent' ? [250, 100, 250, 100, 400] : [150, 80, 200]);
  sendNativePushNotification(title, message, tag);
}
