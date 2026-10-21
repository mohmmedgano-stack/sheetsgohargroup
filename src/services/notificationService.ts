import { ClientLead, User, BrowserNotificationSettings } from '../types';
import { toLocalDateStr } from '../utils/dates';

export type ChimeToneType = 'gold' | 'crystal' | 'dingdong' | 'harp';
export type ChimeVolumeLevel = 'soft' | 'medium' | 'high';

// Web Audio API Chime Synthesizer
let audioCtx: (AudioContext | any) = null;

export const playNotificationChime = (
  tone: ChimeToneType = 'gold',
  volume: ChimeVolumeLevel = 'soft'
) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Volume multiplier mapping
    const peakGain = volume === 'high' ? 0.32 : volume === 'medium' ? 0.20 : 0.12;

    // Define melody patterns for different chime tones
    let notes: { freq: number; start: number; duration: number; type?: OscillatorType }[] = [];

    switch (tone) {
      case 'crystal':
        // Soft Crystal ping (A5 -> E6 -> A6)
        notes = [
          { freq: 880.0, start: 0, duration: 0.28, type: 'sine' },
          { freq: 1318.51, start: 0.08, duration: 0.35, type: 'sine' },
          { freq: 1760.0, start: 0.16, duration: 0.45, type: 'sine' },
        ];
        break;

      case 'dingdong':
        // Warm two-tone Ding-Dong (G5 -> C6)
        notes = [
          { freq: 783.99, start: 0, duration: 0.35, type: 'sine' },
          { freq: 1046.50, start: 0.22, duration: 0.55, type: 'sine' },
        ];
        break;

      case 'harp':
        // Soothing 5-note gentle Harp arpeggio (C5 -> E5 -> G5 -> B5 -> C6)
        notes = [
          { freq: 523.25, start: 0, duration: 0.22, type: 'sine' },
          { freq: 659.25, start: 0.07, duration: 0.24, type: 'sine' },
          { freq: 783.99, start: 0.14, duration: 0.26, type: 'sine' },
          { freq: 987.77, start: 0.21, duration: 0.30, type: 'sine' },
          { freq: 1046.50, start: 0.28, duration: 0.50, type: 'sine' },
        ];
        break;

      case 'gold':
      default:
        // Harmonic Chord Chime (Gohar Gold: D5 -> F#5 -> A5 -> D6)
        notes = [
          { freq: 587.33, start: 0, duration: 0.25, type: 'sine' },      // D5
          { freq: 739.99, start: 0.08, duration: 0.28, type: 'sine' },    // F#5
          { freq: 880.0, start: 0.16, duration: 0.32, type: 'sine' },     // A5
          { freq: 1174.66, start: 0.24, duration: 0.50, type: 'sine' },   // D6
        ];
        break;
    }

    notes.forEach(({ freq, start, duration, type = 'sine' }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.0001, now + start);
      // Soft gentle attack to avoid clicks
      gain.gain.exponentialRampToValueAtTime(peakGain, now + start + 0.035);
      // Natural exponential acoustic decay
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });
  } catch (e) {
    console.warn('Audio chime playback failed:', e);
  }
};

// Check Notification Permission Status
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Request Notification Permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return false;
  }
};

// Local storage key for tracking notified followups to prevent duplicate spam
const NOTIFIED_KEY = 'gohar_notified_followup_keys';

const getNotifiedKeys = (): Set<string> => {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const saveNotifiedKey = (key: string) => {
  try {
    const current = getNotifiedKeys();
    current.add(key);
    // Keep set bounded to last 200 keys
    const arr = Array.from(current).slice(-200);
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr));
  } catch {}
};

// Send a Desktop / Browser Notification
export const sendBrowserNotification = (
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    clientId?: string;
    data?: any;
    soundEnabled?: boolean;
    chimeTone?: ChimeToneType;
    chimeVolume?: ChimeVolumeLevel;
    onClick?: () => void;
  }
): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    if (options.soundEnabled !== false) {
      playNotificationChime(options.chimeTone || 'gold', options.chimeVolume || 'soft');
    }

    const defaultIcon = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=192';

    const notif = new Notification(title, {
      body: options.body,
      icon: options.icon || defaultIcon,
      tag: options.tag || `gohar-notif-${Date.now()}`,
      requireInteraction: true,
      data: options.data,
    });

    notif.onclick = () => {
      window.focus();
      if (options.onClick) {
        options.onClick();
      }
      notif.close();
    };

    return true;
  } catch (e) {
    console.error('Failed to create browser notification:', e);
    return false;
  }
};

// Helper to parse time strings like "14:30", "2:30 PM", "10:00"
const parseTimeToMinutes = (timeStr?: string): number | null => {
  if (!timeStr) return null;
  const clean = timeStr.trim();
  
  // Format HH:MM (24-hour)
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }

  // Format 12-hour AM/PM
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|ص|م)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if ((period === 'PM' || period === 'م') && hours < 12) hours += 12;
    if ((period === 'AM' || period === 'ص') && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  return null;
};

// Scan and notify upcoming follow-ups
export const checkAndNotifyFollowUps = (
  clients: ClientLead[],
  currentUser: User,
  settings: BrowserNotificationSettings,
  onInAppNotification?: (title: string, message: string, clientId?: string) => void
) => {
  if (!settings.enabled || getNotificationPermission() !== 'granted') {
    return;
  }

  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const notifiedKeys = getNotifiedKeys();

  // Filter clients assigned to current user (or all if admin)
  const relevantClients = currentUser.role === 'ADMIN'
    ? clients
    : clients.filter(c => c.assignedUserId === currentUser.id);

  relevantClients.forEach(client => {
    // 1. Check Follow-Up Date & Time
    if (client.followUpDate === todayStr && client.followUpTime) {
      const scheduledMinutes = parseTimeToMinutes(client.followUpTime);
      if (scheduledMinutes !== null) {
        const diffMinutes = scheduledMinutes - currentMinutes;

        // Condition A: Upcoming within advanceMinutes (e.g. 15 or 30 mins)
        if (diffMinutes >= 0 && diffMinutes <= settings.advanceMinutes) {
          const notifKey = `upcoming_${client.id}_${todayStr}_${client.followUpTime}_${settings.advanceMinutes}`;
          if (!notifiedKeys.has(notifKey)) {
            const timeLabel = diffMinutes === 0 ? 'الآن فوراً ⏰' : `خلال ${diffMinutes} دقيقة`;
            const title = `🔔 اقتراب موعد متابعة: ${client.name}`;
            const body = `مشروع: ${client.projectName || 'غير محدد'} | الموعد: ${client.followUpTime} (${timeLabel})\nرقم الهاتف: ${client.phone}\nالموظف المسؤول: ${client.assignedUserName}`;

            sendBrowserNotification(title, {
              body,
              soundEnabled: settings.soundEnabled,
              chimeTone: settings.chimeTone,
              chimeVolume: settings.chimeVolume,
              tag: notifKey,
              clientId: client.id,
              onClick: () => {
                window.focus();
                // Dispatch custom event so UI can open FollowUp modal or jump to lead
                window.dispatchEvent(new CustomEvent('gohar:open-client', { detail: { clientId: client.id } }));
              },
            });

            if (onInAppNotification) {
              onInAppNotification(title, body, client.id);
            }

            saveNotifiedKey(notifKey);
          }
        }

        // Condition B: Overdue today (scheduled time has passed by 5-60 mins)
        if (settings.notifyOnOverdue && diffMinutes < 0 && diffMinutes >= -60) {
          const overdueKey = `overdue_${client.id}_${todayStr}_${client.followUpTime}`;
          if (!notifiedKeys.has(overdueKey)) {
            const minutesLate = Math.abs(diffMinutes);
            const title = `🚨 تنبيه تأخر متابعة: ${client.name}`;
            const body = `فات موعد الاتصال المحدد (${client.followUpTime}) منذ ${minutesLate} دقيقة!\nالمشروع: ${client.projectName} | الهاتف: ${client.phone}`;

            sendBrowserNotification(title, {
              body,
              soundEnabled: settings.soundEnabled,
              chimeTone: settings.chimeTone,
              chimeVolume: settings.chimeVolume,
              tag: overdueKey,
              clientId: client.id,
              onClick: () => {
                window.focus();
                window.dispatchEvent(new CustomEvent('gohar:open-client', { detail: { clientId: client.id } }));
              },
            });

            if (onInAppNotification) {
              onInAppNotification(title, body, client.id);
            }

            saveNotifiedKey(overdueKey);
          }
        }
      }
    }

    // 2. Check Overdue Date (Scheduled for past days)
    if (settings.notifyOnOverdue && client.followUpDate && client.followUpDate < todayStr) {
      if (client.status === 'مهتم' || client.status === 'هرجع اكلمه تاني') {
        const pastOverdueKey = `past_overdue_${client.id}_${client.followUpDate}_${todayStr}`;
        if (!notifiedKeys.has(pastOverdueKey)) {
          const title = `⚠️ متابعة متأخرة عاجلة: ${client.name}`;
          const body = `العميل المهتم بمشروع ${client.projectName} كان مجدولاً لتاريخ (${client.followUpDate}) ولم يتم تسجيل تحديث جديد.\nالهاتف: ${client.phone}`;

          sendBrowserNotification(title, {
            body,
            soundEnabled: settings.soundEnabled,
            chimeTone: settings.chimeTone,
            chimeVolume: settings.chimeVolume,
            tag: pastOverdueKey,
            clientId: client.id,
          });

          if (onInAppNotification) {
            onInAppNotification(title, body, client.id);
          }

          saveNotifiedKey(pastOverdueKey);
        }
      }
    }
  });
};
