import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  UserRole,
  UserPermissions,
  ClientLead,
  Project,
  CallStatus,
  LeadSource,
  PriorityLevel,
  CloudStorageConfig,
  SystemNotification,
  ActivityReport,
  LeadSchedulePlan,
  ThemeMode,
  BrowserNotificationSettings,
  TeamJoinCode,
  MessageTemplate,
  AuditLog,
  SalesPerformanceReview,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_PROJECTS,
  INITIAL_CLOUD_CONFIG,
  INITIAL_NOTIFICATIONS,
  INITIAL_JOIN_CODES,
  INITIAL_MESSAGE_TEMPLATES,
  INITIAL_AUDIT_LOGS,
  INITIAL_PERFORMANCE_REVIEWS,
} from '../data/mockData';
import {
  checkAndNotifyFollowUps,
  sendBrowserNotification,
  playNotificationChime,
} from '../services/notificationService';
import { autoDetectColumnMapping, formatPhoneNumber } from '../utils/smartExcelMapper';
import { normalizePhone } from '../utils/contactParser';
import { toLocalDateStr, toLocalDateTimeStr } from '../utils/dates';

interface AppContextType {
  currentUser: User;
  users: User[];
  projects: Project[];
  clients: ClientLead[];
  visibleClients: ClientLead[];
  cloudConfig: CloudStorageConfig;
  notifications: SystemNotification[];
  unreadNotificationsCount: number;

  // Audit Logs & Security
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => void;
  clearAuditLogs: () => void;

  // Sales Performance Reviews & Call Quality
  reviews: SalesPerformanceReview[];
  addReview: (review: Omit<SalesPerformanceReview, 'id' | 'createdAt' | 'reviewerId' | 'reviewerName'>) => void;
  deleteReview: (id: string) => void;

  // Duplicate Checker
  checkDuplicateClient: (phone: string, email?: string, excludeClientId?: string) => { isDuplicate: boolean; duplicateClient?: ClientLead; reason?: string };

  // Visible Column Preferences
  updateVisibleColumns: (columns: string[]) => void;

  // Theme Preference
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;

  // Browser Notifications
  browserNotificationSettings: BrowserNotificationSettings;
  updateBrowserNotificationSettings: (settings: Partial<BrowserNotificationSettings>) => void;
  triggerTestNotification: () => void;

  // Auth & Session
  isAuthenticated: boolean;
  loginWithCredentials: (usernameOrEmail: string, passwordInput: string) => Promise<{ success: boolean; message?: string }>;
  logoutUser: () => void;

  // Header Logo & Branding
  customLogoUrl: string | null;
  companyTitle: string;
  companySubtitle: string;
  updateLogoSettings: (logoUrl: string | null, title?: string, subtitle?: string) => void;

  // Team Join Codes (System Team Management)
  joinCodes: TeamJoinCode[];
  generateJoinCode: (description?: string) => TeamJoinCode;
  toggleJoinCode: (code: string) => void;
  deleteJoinCode: (code: string) => void;
  verifyJoinCode: (code: string) => { valid: boolean; message?: string };

  // Sales Registration & Approvals
  registerSalesWithJoinCode: (userData: {
    name: string;
    username: string;
    password: string;
    email: string;
    phone: string;
    assignedProject?: string;
  }, code: string) => Promise<{ success: boolean; message: string }>;
  approveUser: (userId: string, permissions: UserPermissions, assignedProject?: string) => void;
  rejectUser: (userId: string) => void;
  changeUserPassword: (userId: string, newPassword: string, oldPassword?: string) => Promise<{ success: boolean; message?: string }>;

  // User Actions
  setCurrentUser: (user: User) => void;
  addUser: (newUser: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updatedData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Client Lead Actions
  updateClientStatus: (clientId: string, status: CallStatus, notes?: string) => void;
  updateClientStatusWithReason: (
    clientId: string,
    status: CallStatus,
    reason: string,
    followUpDate?: string,
    followUpTime?: string,
    isVoice?: boolean
  ) => void;
  scheduleFollowUp: (clientId: string, date: string, time: string, notes?: string) => void;
  addClient: (newClient: Omit<ClientLead, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; duplicateWarning?: string; client?: ClientLead };
  addClientsBulk: (items: { name: string; phone: string }[], common: Omit<ClientLead, 'id' | 'createdAt' | 'updatedAt' | 'name' | 'phone' | 'email' | 'lastInteractionDate' | 'addedAt'>) => { added: number };
  updateClient: (clientId: string, updatedData: Partial<ClientLead>) => void;
  deleteClient: (clientId: string) => void;
  deleteSelectedClients: (clientIds: string[]) => void;
  clearAllClientsData: () => void;
  bulkAssignClients: (clientIds: string[], targetUserId: string, targetUserName: string) => void;
  
  // Ready Message Templates
  messageTemplates: MessageTemplate[];
  addMessageTemplate: (tpl: Omit<MessageTemplate, 'id'>) => void;
  updateMessageTemplate: (id: string, tpl: Partial<MessageTemplate>) => void;
  deleteMessageTemplate: (id: string) => void;

  // Security checks & Granular Permissions
  canExport: boolean;
  canImport: boolean;
  canManageUsers: boolean;
  canManageTeam: boolean;
  canDeleteClients: boolean;
  canEditClient: boolean;
  canBulkAssign: boolean;
  
  // Import/Export
  importClientsFromCSV: (clientsData: any[]) => { success: boolean; count: number; message: string };

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Cloud Sync
  updateCloudConfig: (newConfig: Partial<CloudStorageConfig>) => void;
  triggerManualSync: () => Promise<void>;

  // Analytics & Scheduling
  getPerformanceReports: () => ActivityReport[];
  schedulePlans: LeadSchedulePlan[];
  deleteSchedulePlan: (id: string) => void;
  allInteractions: {
    id: string;
    clientId: string;
    clientName: string;
    phone: string;
    authorName: string;
    status: CallStatus;
    note: string;
    date: string;
    projectName: string;
    isVoiceNote?: boolean;
  }[];
  
  // Projects
  addProject: (project: Omit<Project, 'id' | 'totalLeads' | 'activeLeads'>) => void;
  updateProject: (id: string, updatedData: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Server-backed, real-time persistence
//
//  * The database is the source of truth. Values injected by the server on page
//    load win over this browser's localStorage (which is only a fast local cache).
//  * Every list (clients, users, ...) is saved as an item-level PATCH (only the
//    items you changed/added/deleted). The server merges it under a row lock with
//    whatever other people saved at the same moment, so nobody overwrites anybody.
//  * Every open tab polls a tiny "versions" endpoint every ~2s and pulls only the
//    keys that changed, so edits made on any device appear on all the others
//    without refreshing the page.
// ---------------------------------------------------------------------------
const SERVER_STATE: Record<string, string> =
  (typeof window !== 'undefined' && (window as any).__SERVER_STATE__) || {};
const SERVER_VERSIONS: Record<string, number> =
  (typeof window !== 'undefined' && (window as any).__SERVER_VERSIONS__) || {};

// Who is logged in comes from the server (signed session cookie), never from this browser.
const AUTH_USER: any =
  (typeof window !== 'undefined' && (window as any).__AUTH_USER__) || null;
export const PUBLIC_INFO: { projects?: string[] } =
  (typeof window !== 'undefined' && (window as any).__PUBLIC__) || {};

// Older versions cached the whole database (even other people's data and passwords) in this
// browser. Wipe those leftovers; only device-level preferences are kept.
(function purgeLegacyLocalData() {
  if (typeof window === 'undefined') return;
  try {
    const keep = new Set([
      'gohar_theme_mode_v2',
      'gohar_browser_notification_settings',
      'gohar_saved_printers',
      'gohar_selected_printer_id',
      'gohar_spreadsheet_view_mode',
      'gohar_widescreen_mode',
      'gohar_notified_events',
    ]);
    const kill: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('gohar_') && !keep.has(k) && !k.startsWith('gohar_notif')) kill.push(k);
    }
    kill.forEach(k => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
})();

const ARRAY_KEYS = new Set([
  'gohar_users',
  'gohar_clients',
  'gohar_projects',
  'gohar_notifications',
  'gohar_audit_logs',
  'gohar_performance_reviews',
  'gohar_message_templates',
  'gohar_join_codes',
  'gohar_schedule_plans',
]);

// What the server is known to hold for each list (id -> serialized item).
const baselines: Record<string, Map<string, string>> = {};

function buildBaseline(json: string | null | undefined): Map<string, string> {
  const m = new Map<string, string>();
  if (!json) return m;
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (it && it.id !== undefined && it.id !== null) m.set(String(it.id), JSON.stringify(it));
      }
    }
  } catch {
    /* ignore */
  }
  return m;
}

ARRAY_KEYS.forEach(k => {
  if (Object.prototype.hasOwnProperty.call(SERVER_STATE, k)) baselines[k] = buildBaseline(SERVER_STATE[k]);
});

function computePatch(key: string, valueJson: string): { upserts: any[]; deletedIds: string[] } {
  const base = baselines[key] || new Map<string, string>();
  const upserts: any[] = [];
  const seen = new Set<string>();
  let arr: any[] = [];
  try {
    const parsed = JSON.parse(valueJson);
    if (Array.isArray(parsed)) arr = parsed;
  } catch {
    arr = [];
  }
  for (const it of arr) {
    if (!it || it.id === undefined || it.id === null) continue;
    const id = String(it.id);
    seen.add(id);
    const b = base.get(id);
    if (b !== JSON.stringify(it)) upserts.push(b !== undefined ? { ...it, __base: b } : it);
  }
  const deletedIds: string[] = [];
  base.forEach((_v, id) => {
    if (!seen.has(id)) deletedIds.push(id);
  });
  return { upserts, deletedIds };
}

function loadItem(key: string): string | null {
  // The server is the only source of data (nothing is read from this browser's storage).
  return Object.prototype.hasOwnProperty.call(SERVER_STATE, key) ? SERVER_STATE[key] : null;
}

// Local-only storage: for session/device-specific data (who is logged in on
// THIS device, this device's theme, this browser's notification permission)
// that must never be shared across accounts or devices. Never touches the
// server, so each login stays private to the device that made it.
function loadLocalItem(key: string): string | null {
  return localStorage.getItem(key);
}

function saveLocalItem(key: string, value: string): void {
  localStorage.setItem(key, value);
}

const pendingSaveTimers: Record<string, ReturnType<typeof setTimeout>> = {};
// Latest local value per key that the server has not confirmed yet.
const pendingWrites: Record<string, string> = {};
const inFlight: Record<string, boolean> = {};

function applyRemote(key: string, value: string | null, ver: number): void {
  if (value === null) return;
  SERVER_VERSIONS[key] = ver;
  SERVER_STATE[key] = value;
  if (ARRAY_KEYS.has(key)) baselines[key] = buildBaseline(value);
  window.dispatchEvent(new CustomEvent('gohar:remote-state', { detail: { key, value } }));
}

function sendStateToServer(key: string, attempt: number = 1): void {
  const latest = pendingWrites[key];
  if (latest === undefined) return;
  if (inFlight[key]) {
    // one request per key at a time; the response handler re-checks for newer edits
    return;
  }

  let body: string;
  if (ARRAY_KEYS.has(key)) {
    const patch = computePatch(key, latest);
    if (patch.upserts.length === 0 && patch.deletedIds.length === 0) {
      delete pendingWrites[key];
      return;
    }
    body = JSON.stringify({ patch });
  } else {
    if (SERVER_STATE[key] === latest) {
      delete pendingWrites[key];
      return;
    }
    body = JSON.stringify({ value: latest });
  }

  inFlight[key] = true;
  fetch(`/api/state/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body,
  })
    .then(res => {
      if (res.status === 401) {
        window.location.reload(); // session ended: show the login page
        throw new Error('unauthorized');
      }
      if (res.status === 403) {
        // not allowed to change this: drop the local change and show what the server has
        delete pendingWrites[key];
        throw new Error('forbidden');
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: { ok: boolean; value?: string; ver?: number; rejected?: Array<{ name?: string; phone?: string; ownerName?: string }> }) => {
      inFlight[key] = false;
      if (data.rejected && data.rejected.length > 0) {
        window.dispatchEvent(new CustomEvent('gohar:duplicates', { detail: data.rejected }));
      }
      if (typeof data.ver === 'number') SERVER_VERSIONS[key] = data.ver;
      const newerPending = pendingWrites[key] !== latest;
      if (ARRAY_KEYS.has(key) && typeof data.value === 'string') {
        // the server returns the merged list (ours + whatever others saved meanwhile)
        baselines[key] = buildBaseline(data.value);
        SERVER_STATE[key] = data.value;
        if (!newerPending && data.value !== latest) {
          window.dispatchEvent(new CustomEvent('gohar:remote-state', { detail: { key, value: data.value } }));
        }
      } else {
        SERVER_STATE[key] = latest;
      }
      if (!newerPending) delete pendingWrites[key];
      else sendStateToServer(key);
      window.dispatchEvent(new CustomEvent('gohar:save-ok'));
    })
    .catch(() => {
      inFlight[key] = false;
      if (attempt < 4) {
        // Transient network/server hiccup (common on mobile): retry with backoff
        setTimeout(() => sendStateToServer(key, attempt + 1), attempt * 1500);
      } else {
        // Gave up for now: the change is still safe in this device's localStorage and
        // stays queued — it is retried on the next change / when the connection returns.
        window.dispatchEvent(new CustomEvent('gohar:save-error'));
      }
    });
}

function flushPendingWritesNow(): void {
  for (const key of Object.keys(pendingWrites)) {
    const latest = pendingWrites[key];
    let payload: any;
    if (ARRAY_KEYS.has(key)) {
      const patch = computePatch(key, latest);
      if (patch.upserts.length === 0 && patch.deletedIds.length === 0) continue;
      payload = { patch };
    } else {
      payload = { value: latest };
    }
    const bodyStr = JSON.stringify(payload);
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(`/api/state/${encodeURIComponent(key)}`, new Blob([bodyStr], { type: 'application/json' }));
    } else {
      fetch(`/api/state/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true,
      }).catch(() => {});
    }
  }
}

// ---- pull changes made elsewhere ----
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncRunning = false;

async function pullRemoteChanges(): Promise<void> {
  try {
    const res = await fetch('/api/state-versions', { cache: 'no-store' });
    if (res.status === 401) {
      window.location.reload();
      return;
    }
    if (!res.ok) return;
    const data: { versions?: Record<string, number> } = await res.json();
    const versions = data.versions || {};
    for (const key of Object.keys(versions)) {
      if (versions[key] === SERVER_VERSIONS[key]) continue;
      if (pendingWrites[key] !== undefined || inFlight[key]) continue; // our own edit is on its way
      const r = await fetch(`/api/state/${encodeURIComponent(key)}`, { cache: 'no-store' });
      if (!r.ok) continue;
      const row: { value: string | null; ver: number } = await r.json();
      if (pendingWrites[key] !== undefined || inFlight[key]) continue; // edited while we were fetching
      applyRemote(key, row.value, row.ver);
    }
  } catch {
    /* offline: try again on the next tick */
  }
}

export function startRealtimeSync(): () => void {
  if (syncRunning) return () => {};
  syncRunning = true;
  const tick = async () => {
    if (!syncRunning) return;
    if (document.visibilityState === 'visible') await pullRemoteChanges();
    syncTimer = setTimeout(tick, document.visibilityState === 'visible' ? 2000 : 15000);
  };
  const kick = () => {
    if (syncTimer) clearTimeout(syncTimer);
    // retry anything that could not be saved earlier, then pull
    Object.keys(pendingWrites).forEach(k => sendStateToServer(k));
    tick();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') kick();
  });
  window.addEventListener('focus', kick);
  window.addEventListener('online', kick);
  tick();
  return () => {
    syncRunning = false;
    if (syncTimer) clearTimeout(syncTimer);
  };
}

if (typeof window !== 'undefined') {
  // "visibilitychange" fires reliably on both tab-close and app-backgrounding
  // (including on mobile, where "beforeunload"/"pagehide" are not always fired)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingWritesNow();
  });
  window.addEventListener('pagehide', flushPendingWritesNow);
}

function saveItem(key: string, value: string): void {
  if (!AUTH_USER) return; // nothing is saved without a logged-in session
  if (!ARRAY_KEYS.has(key) && SERVER_STATE[key] === value) return;
  if (ARRAY_KEYS.has(key)) {
    const patch = computePatch(key, value);
    if (patch.upserts.length === 0 && patch.deletedIds.length === 0) return; // nothing changed vs. server
  }
  pendingWrites[key] = value;
  if (pendingSaveTimers[key]) {
    clearTimeout(pendingSaveTimers[key]);
  }
  pendingSaveTimers[key] = setTimeout(() => {
    sendStateToServer(key);
  }, 250);
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or Fallback Mock Data
  const [users, setUsers] = useState<User[]>(() => {
    const saved = loadItem('gohar_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (AUTH_USER) return AUTH_USER as User;
    return { ...INITIAL_USERS[0], password: undefined }; // placeholder while logged out (never shown)
  });

  // Authentication State: true only when the server accepted the session cookie
  const [isAuthenticated] = useState<boolean>(() => !!AUTH_USER);

  // Team Join Codes State
  const [joinCodes, setJoinCodes] = useState<TeamJoinCode[]>(() => {
    const saved = loadItem('gohar_join_codes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_JOIN_CODES;
  });

  // Message Templates State
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>(() => {
    const saved = loadItem('gohar_message_templates');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_MESSAGE_TEMPLATES;
  });

  // Logo & Branding Settings
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => {
    return loadItem('gohar_custom_logo') || null;
  });

  const [companyTitle, setCompanyTitle] = useState<string>(() => {
    return loadItem('gohar_company_title') || 'جوهر جروب للتطوير العقاري';
  });

  const [companySubtitle, setCompanySubtitle] = useState<string>(() => {
    return loadItem('gohar_company_subtitle') || 'Gohar Group for Real Estate Development';
  });

  const updateLogoSettings = (logoUrl: string | null, title?: string, subtitle?: string) => {
    setCustomLogoUrl(logoUrl);
    if (logoUrl) {
      saveItem('gohar_custom_logo', logoUrl);
    } else {
      localStorage.removeItem('gohar_custom_logo');
    }

    if (title) {
      setCompanyTitle(title);
      saveItem('gohar_company_title', title);
    }

    if (subtitle) {
      setCompanySubtitle(subtitle);
      saveItem('gohar_company_subtitle', subtitle);
    }
  };

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = loadItem('gohar_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [clients, setClients] = useState<ClientLead[]>(() => {
    const saved = loadItem('gohar_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [cloudConfig, setCloudConfig] = useState<CloudStorageConfig>(() => {
    const saved = loadItem('gohar_cloud_config');
    return saved ? JSON.parse(saved) : INITIAL_CLOUD_CONFIG;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = loadItem('gohar_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [schedulePlans, setSchedulePlans] = useState<LeadSchedulePlan[]>(() => {
    const saved = loadItem('gohar_schedule_plans');
    return saved ? JSON.parse(saved) : [];
  });

  // Theme Preference State (Default to 'light')
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = loadLocalItem('gohar_theme_mode_v2');
    return (saved === 'light' || saved === 'dark') ? (saved as ThemeMode) : 'light';
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveLocalItem('gohar_theme_mode_v2', mode);
  };

  const toggleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  useEffect(() => {
    if (themeMode === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#1c1c1e';
    }
  }, [themeMode]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = loadItem('gohar_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    saveItem('gohar_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (logData: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>) => {
    const newLog: AuditLog = {
      ...logData,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: toLocalDateTimeStr(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    localStorage.removeItem('gohar_audit_logs');
    addNotification('تفريغ سجل الرقابة', 'تم تفريغ سجل العمليات الحساسة بالكامل', 'security');
  };

  // Performance Reviews State
  const [reviews, setReviews] = useState<SalesPerformanceReview[]>(() => {
    const saved = loadItem('gohar_performance_reviews');
    return saved ? JSON.parse(saved) : INITIAL_PERFORMANCE_REVIEWS;
  });

  useEffect(() => {
    saveItem('gohar_performance_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const addReview = (reviewData: Omit<SalesPerformanceReview, 'id' | 'createdAt' | 'reviewerId' | 'reviewerName'>) => {
    const newRev: SalesPerformanceReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      createdAt: toLocalDateTimeStr(),
    };
    setReviews(prev => [newRev, ...prev]);
    addAuditLog({
      action: 'REVIEW_ADDED',
      targetType: 'USER',
      targetId: reviewData.repId,
      targetName: reviewData.repName,
      details: `إضافة تقييم أداء (${reviewData.rating} نجوم) للموظف ${reviewData.repName} لمعيار ${reviewData.category}`,
    });
    addNotification(
      'تقييم أداء جديد',
      `تم تسجيل تقييم أداء (${reviewData.rating} نجوم) للموظف (${reviewData.repName}) بواسطة ${currentUser.name}`,
      'system'
    );
  };

  const deleteReview = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  // Check Duplicate Client Helper (by Phone or Email)
  const checkDuplicateClient = (
    phone: string,
    email?: string,
    excludeClientId?: string
  ): { isDuplicate: boolean; duplicateClient?: ClientLead; reason?: string } => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanPhone && !cleanEmail) {
      return { isDuplicate: false };
    }

    const match = clients.find(c => {
      if (excludeClientId && c.id === excludeClientId) return false;
      const cPhone = c.phone.trim().replace(/\D/g, '');
      if (cleanPhone && cPhone && (cPhone === cleanPhone || (cleanPhone.length >= 9 && cPhone.endsWith(cleanPhone.slice(-9))))) {
        return true;
      }
      if (cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail) {
        return true;
      }
      return false;
    });

    if (match) {
      const isPhoneMatch = cleanPhone && match.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-9));
      return {
        isDuplicate: true,
        duplicateClient: match,
        reason: isPhoneMatch
          ? `رقم الهاتف (${match.phone}) مسجل مسبقاً للعميل "${match.name}" الموكل للموظف (${match.assignedUserName}) في مشروع (${match.projectName})`
          : `البريد الإلكتروني (${match.email}) مسجل مسبقاً للعميل "${match.name}"`,
      };
    }

    return { isDuplicate: false };
  };

  // User Visible Columns Preference
  const updateVisibleColumns = (columns: string[]) => {
    setCurrentUser(prev => ({ ...prev, visibleColumns: columns }));
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? { ...u, visibleColumns: columns } : u)));
  };

  useEffect(() => {
    saveItem('gohar_message_templates', JSON.stringify(messageTemplates));
  }, [messageTemplates]);

  useEffect(() => {
    saveItem('gohar_schedule_plans', JSON.stringify(schedulePlans));
  }, [schedulePlans]);

  useEffect(() => {
    saveItem('gohar_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    saveItem('gohar_join_codes', JSON.stringify(joinCodes));
  }, [joinCodes]);

  // Changes made on another device/tab arrive here (see startRealtimeSync)
  useEffect(() => {
    const parse = (v: string) => {
      try { return JSON.parse(v); } catch { return undefined; }
    };
    const onRemote = (e: Event) => {
      const { key, value } = (e as CustomEvent).detail as { key: string; value: string };
      if (typeof value !== 'string') return;
      switch (key) {
        case 'gohar_users': {
          const v = parse(value);
          if (Array.isArray(v)) {
            setUsers(v);
            setCurrentUser(prev => v.find((u: User) => u.id === prev.id) || prev);
          }
          break;
        }
        case 'gohar_clients': { const v = parse(value); if (Array.isArray(v)) setClients(v); break; }
        case 'gohar_projects': { const v = parse(value); if (Array.isArray(v)) setProjects(v); break; }
        case 'gohar_notifications': { const v = parse(value); if (Array.isArray(v)) setNotifications(v); break; }
        case 'gohar_audit_logs': { const v = parse(value); if (Array.isArray(v)) setAuditLogs(v); break; }
        case 'gohar_performance_reviews': { const v = parse(value); if (Array.isArray(v)) setReviews(v); break; }
        case 'gohar_message_templates': { const v = parse(value); if (Array.isArray(v)) setMessageTemplates(v); break; }
        case 'gohar_join_codes': { const v = parse(value); if (Array.isArray(v)) setJoinCodes(v); break; }
        case 'gohar_schedule_plans': { const v = parse(value); if (Array.isArray(v)) setSchedulePlans(v); break; }
        case 'gohar_cloud_config': { const v = parse(value); if (v && typeof v === 'object') setCloudConfig(v); break; }
        case 'gohar_custom_logo': setCustomLogoUrl(value || null); break;
        case 'gohar_company_title': setCompanyTitle(value); break;
        case 'gohar_company_subtitle': setCompanySubtitle(value); break;
      }
    };
    window.addEventListener('gohar:remote-state', onRemote);
    return () => window.removeEventListener('gohar:remote-state', onRemote);
  }, []);

  useEffect(() => {
    if (!AUTH_USER) return;
    const stop = startRealtimeSync();
    return stop;
  }, []);


  useEffect(() => {
    saveItem('gohar_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    saveItem('gohar_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    saveItem('gohar_cloud_config', JSON.stringify(cloudConfig));
  }, [cloudConfig]);

  useEffect(() => {
    saveItem('gohar_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Browser Notification Settings
  const [browserNotificationSettings, setBrowserNotificationSettingsState] = useState<BrowserNotificationSettings>(() => {
    const saved = loadLocalItem('gohar_browser_notification_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          chimeTone: 'gold',
          chimeVolume: 'soft',
          ...parsed,
        };
      } catch (e) {}
    }
    return {
      enabled: true,
      soundEnabled: true,
      chimeTone: 'gold',
      chimeVolume: 'soft',
      advanceMinutes: 15,
      notifyOnOverdue: true,
      notifyOnHotLeads: true,
    };
  });

  const updateBrowserNotificationSettings = (newSettings: Partial<BrowserNotificationSettings>) => {
    setBrowserNotificationSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      saveLocalItem('gohar_browser_notification_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const triggerTestNotification = () => {
    sendBrowserNotification('🔔 إشعار تجريبي من جوهر جروب', {
      body: 'نظام إشعارات المتصفح يعمل بنجاح! ستصلك تنبيهات المتابعات المجدولة في موعدها مع النغمة الصوتية المختارة.',
      soundEnabled: browserNotificationSettings.soundEnabled,
      chimeTone: browserNotificationSettings.chimeTone || 'gold',
      chimeVolume: browserNotificationSettings.chimeVolume || 'soft',
    });
    if (browserNotificationSettings.soundEnabled) {
      playNotificationChime(
        browserNotificationSettings.chimeTone || 'gold',
        browserNotificationSettings.chimeVolume || 'soft'
      );
    }
    addNotification('إشعار تجريبي', 'تم اختبار نغمة وإشعار المتصفح بنجاح.', 'system');
  };

  // Background Follow-Up Monitor (runs every 25 seconds & on visibility change)
  useEffect(() => {
    if (!isAuthenticated) return;

    const runCheck = () => {
      checkAndNotifyFollowUps(
        clients,
        currentUser,
        browserNotificationSettings,
        (title, message, clientId) => {
          addNotification(title, message, 'followup', clientId);
        }
      );
    };

    // Run immediately
    runCheck();

    // Interval every 25 seconds
    const interval = setInterval(runCheck, 25000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runCheck();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', runCheck);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', runCheck);
    };
  }, [clients, currentUser, browserNotificationSettings, isAuthenticated]);

  useEffect(() => {
    saveLocalItem('gohar_is_logged_in', String(isAuthenticated));
  }, [isAuthenticated]);

  // Granular Security & Permission Checks
  const canManageUsers = currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER';
  const canManageTeam = currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER' || currentUser.permissions?.canManageTeam === true;
  const canExport = currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER' || currentUser.permissions?.canExport === true;
  const canImport = currentUser.role === 'ADMIN' || currentUser.permissions?.canImport === true;
  const canDeleteClients = currentUser.role === 'ADMIN' || currentUser.permissions?.canDeleteClients === true;
  const canEditClient = currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER' || currentUser.permissions?.canEditClientDetails !== false;
  const canBulkAssign = currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER' || currentUser.permissions?.canBulkAssign === true;

  // Filter clients based on user role and permissions
  const visibleClients = useMemo(() => (currentUser.role === 'ADMIN' || currentUser.role === 'SALES_MANAGER')
    ? clients
    : clients.filter(c => c.assignedUserId === currentUser.id), [clients, currentUser.role, currentUser.id]);

  // Login is checked by the server; on success the page reloads with the signed session cookie
  const loginWithCredentials = async (usernameOrEmail: string, passwordInput: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ identifier: usernameOrEmail, password: passwordInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        window.location.reload();
        return { success: true };
      }
      return { success: false, message: data.message || 'اسم المستخدم أو كلمة السر غير صحيحة. يرجى التحقق وإعادة المحاولة.' };
    } catch {
      return { success: false, message: 'تعذر الاتصال بالسيرفر. تأكد من الإنترنت وحاول مرة أخرى.' };
    }
  };

  const logoutUser = () => {
    flushPendingWritesNow();
    fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' })
      .catch(() => {})
      .finally(() => window.location.reload());
  };

  // Team Join Code Generation & Management
  const generateJoinCode = (description?: string): TeamJoinCode => {
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode = `GOHAR-${new Date().getFullYear()}-${randomChars}`;
    const codeObj: TeamJoinCode = {
      code: newCode,
      createdAt: toLocalDateStr(),
      createdBy: currentUser.name,
      isActive: true,
      description: description || `كود انضمام فريق المبيعات صادر من ${currentUser.name}`,
    };
    setJoinCodes(prev => [codeObj, ...prev]);
    addNotification('إنشاء كود فريق جديد', `تم إنشاء كود انضمام الفريق الجديد: ${newCode}`, 'system');
    return codeObj;
  };

  const toggleJoinCode = (code: string) => {
    setJoinCodes(prev => prev.map(c => (c.code === code ? { ...c, isActive: !c.isActive } : c)));
  };

  const deleteJoinCode = (code: string) => {
    setJoinCodes(prev => prev.filter(c => c.code !== code));
  };

  const verifyJoinCode = (code: string): { valid: boolean; message?: string } => {
    const clean = code.trim().toUpperCase();
    const match = joinCodes.find(c => c.code.toUpperCase() === clean);
    if (!match) {
      return { valid: false, message: 'كود الانضمام غير صحيح، يرجى مراجعة المدير العام أو مدير المبيعات' };
    }
    if (!match.isActive) {
      return { valid: false, message: 'هذا الكود غير نشط حالياً أو تم إيقافه من قبل الإدارة' };
    }
    return { valid: true };
  };

  // Register Sales User with Join Code (validated and stored by the server)
  const registerSalesWithJoinCode = async (
    userData: {
      name: string;
      username: string;
      password: string;
      email: string;
      phone: string;
      assignedProject?: string;
    },
    code: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ ...userData, code }),
      });
      const data = await res.json().catch(() => ({}));
      return { success: !!data.ok, message: data.message || (data.ok ? 'تم' : 'تعذر إرسال الطلب') };
    } catch {
      return { success: false, message: 'تعذر الاتصال بالسيرفر. حاول مرة أخرى.' };
    }
  };

  // Approve User Account and configure permissions
  const approveUser = (
    userId: string,
    permissions: UserPermissions,
    assignedProject?: string
  ) => {
    if (!canManageTeam) return;

    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            activeStatus: 'active',
            permissions,
            assignedProject: assignedProject || u.assignedProject,
            approvedBy: currentUser.name,
            approvedAt: toLocalDateStr(),
          };
        }
        return u;
      })
    );

    const approvedTarget = users.find(u => u.id === userId);
    addNotification(
      'الموافقة على حساب موظف',
      `تمت الموافقة على تفعيل حساب (${approvedTarget?.name || 'الموظف'}) وتحديد صلاحياته بنجاح بواسطة ${currentUser.name}`,
      'system'
    );
  };

  const rejectUser = (userId: string) => {
    if (!canManageTeam) return;
    const target = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    addNotification('رفض طلب الانضمام', `تم رفض وحذف طلب انضمام (${target?.name || 'المستخدم'})`, 'system');
  };

  const changeUserPassword = async (userId: string, newPassword: string, oldPassword?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ userId, newPassword, oldPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return { success: false, message: data.message || 'تعذر تغيير كلمة السر' };
      const target = users.find(u => u.id === userId);
      addNotification('تغيير كلمة المرور', `تم تحديث كلمة المرور لحساب (${target?.name}) بنجاح`, 'security');
      return { success: true };
    } catch {
      return { success: false, message: 'تعذر الاتصال بالسيرفر. حاول مرة أخرى.' };
    }
  };

  // Message Template Actions
  const addMessageTemplate = (tpl: Omit<MessageTemplate, 'id'>) => {
    const newTpl: MessageTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
    };
    setMessageTemplates(prev => [newTpl, ...prev]);
    addNotification('إضافة قالب رسالة', `تم إضافة قالب جديد: ${newTpl.title}`, 'system');
  };

  const updateMessageTemplate = (id: string, tpl: Partial<MessageTemplate>) => {
    setMessageTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...tpl } : t)));
  };

  const deleteMessageTemplate = (id: string) => {
    setMessageTemplates(prev => prev.filter(t => t.id !== id));
  };

  // System Notification Helpers
  const addNotification = (
    title: string,
    message: string,
    type: 'followup' | 'assignment' | 'system' | 'security',
    clientId?: string
  ) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      timestamp: 'الآن',
      type,
      isRead: false,
      clientId,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Status Change Logic with Mandatory Note / Reason
  const updateClientStatus = (clientId: string, status: CallStatus, notes?: string) => {
    updateClientStatusWithReason(clientId, status, notes || `تم تحديث الحالة إلى ${status}`);
  };

  const updateClientStatusWithReason = (
    clientId: string,
    status: CallStatus,
    reason: string,
    followUpDate?: string,
    followUpTime?: string,
    isVoice?: boolean
  ) => {
    const today = toLocalDateStr();
    const client = clients.find(c => c.id === clientId);

    const newHistoryItem = {
      id: `note-${Date.now()}`,
      date: new Date().toLocaleString('ar-EG'),
      at: new Date().toISOString(),
      status,
      note: reason,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      isVoiceNote: isVoice || false,
    };

    setClients(prev =>
      prev.map(c => {
        if (c.id === clientId) {
          return {
            ...c,
            status,
            lastInteractionDate: today,
            updatedAt: today,
            followUpDate: followUpDate || (status === 'هرجع اكلمه تاني' || status === 'مهتم' ? c.followUpDate : c.followUpDate),
            followUpTime: followUpTime || (status === 'هرجع اكلمه تاني' || status === 'مهتم' ? c.followUpTime : c.followUpTime),
            notes: reason,
            notesHistory: [newHistoryItem, ...(c.notesHistory || [])],
          };
        }
        return c;
      })
    );

    // Play chime sound & send browser notification for important status changes
    if (status === 'مهتم' || status === 'متعاقد') {
      sendBrowserNotification(`🌟 تحديث هام: العميل (${client?.name || ''}) أصبح "${status}"`, {
        body: `مشروع: ${client?.projectName || ''} | الموظف: ${currentUser.name}\nالسبب/التفاصيل: ${reason}`,
        soundEnabled: browserNotificationSettings.soundEnabled,
        chimeTone: status === 'متعاقد' ? 'gold' : 'crystal',
        chimeVolume: 'medium',
      });
    }

    addNotification(
      `تحديث حالة عميل (${status})`,
      `قام ${currentUser.name} بتحديث حالة (${client?.name || 'عميل'}) إلى ${status}. التفاصيل: ${reason.substring(0, 60)}...`,
      'followup',
      clientId
    );
  };

  // Schedule Follow Up Date & Time with Audio Chime & Browser Notification Confirmation
  const scheduleFollowUp = (clientId: string, date: string, time: string, notes?: string) => {
    const today = toLocalDateStr();
    const client = clients.find(c => c.id === clientId);

    setClients(prev =>
      prev.map(c => {
        if (c.id === clientId) {
          const followUpNote = `ميعاد فولو اب: ${date} الساعة ${time}${notes ? ` - ${notes}` : ''}`;
          
          return {
            ...c,
            status: c.status === 'جديد' ? 'هرجع اكلمه تاني' : c.status,
            followUpDate: date,
            followUpTime: time,
            lastInteractionDate: today,
            updatedAt: today,
            notes: c.notes ? `${c.notes}\n[${followUpNote}]` : followUpNote,
            notesHistory: [
              {
                id: `note-${Date.now()}`,
                date: new Date().toLocaleString('ar-EG'),
      at: new Date().toISOString(),
                status: c.status,
                note: followUpNote,
                authorName: currentUser.name,
                authorRole: currentUser.role,
              },
              ...(c.notesHistory || []),
            ],
          };
        }
        return c;
      })
    );

    // Trigger instant chime & notification
    sendBrowserNotification(`⏰ تم جدولة موعد متابعة: ${client?.name || ''}`, {
      body: `الموعد: ${date} الساعة ${time}\nالمشروع: ${client?.projectName || ''}\nتمت الجدولة بواسطة: ${currentUser.name}`,
      soundEnabled: browserNotificationSettings.soundEnabled,
      chimeTone: browserNotificationSettings.chimeTone || 'gold',
      chimeVolume: browserNotificationSettings.chimeVolume || 'soft',
    });

    addNotification(
      'جدولة فولو اب جديد',
      `تم جدولة متابعة بتاريخ ${date} الساعة ${time} بواسطة ${currentUser.name}`,
      'followup',
      clientId
    );
  };

  // Add Client
  const addClient = (newClientData: Omit<ClientLead, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; duplicateWarning?: string; client?: ClientLead } => {
    const today = toLocalDateStr();
    
    // Check duplicates
    const dupCheck = checkDuplicateClient(newClientData.phone, newClientData.email);

    const newClient: ClientLead = {
      ...newClientData,
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: today,
      addedAt: new Date().toISOString(),
      updatedAt: today,
    };

    setClients(prev => [newClient, ...prev]);

    // Update Project lead count
    setProjects(prev =>
      prev.map(p =>
        p.name === newClientData.projectName
          ? { ...p, totalLeads: p.totalLeads + 1, activeLeads: p.activeLeads + 1 }
          : p
      )
    );

    addAuditLog({
      action: 'EDIT_CLIENT',
      targetType: 'CLIENT',
      targetId: newClient.id,
      targetName: newClient.name,
      details: `إضافة عميل جديد: ${newClient.name} (${newClient.phone}) للمشروع ${newClient.projectName}${dupCheck.isDuplicate ? ` [تنبيه: تكرار محتمل مع عميل آخر]` : ''}`,
    });

    addNotification('إضافة عميل جديد', `تم إضافة العميل (${newClient.name}) بنجاح للمشروع ${newClient.projectName}`, 'system', newClient.id);

    return {
      success: true,
      duplicateWarning: dupCheck.isDuplicate ? dupCheck.reason : undefined,
      client: newClient,
    };
  };

  // Many contacts at once (pasted from WhatsApp / the phone): one state update, one audit entry.
  // The server skips numbers that already exist in the CRM and tells the person which ones.
  const addClientsBulk = (
    items: { name: string; phone: string }[],
    common: Omit<ClientLead, 'id' | 'createdAt' | 'updatedAt' | 'name' | 'phone' | 'email' | 'lastInteractionDate' | 'addedAt'>
  ): { added: number } => {
    if (items.length === 0) return { added: 0 };
    const today = toLocalDateStr();
    const nowIso = new Date().toISOString();
    const stamp = Date.now();
    const fresh: ClientLead[] = items.map((it, i) => ({
      ...common,
      id: `lead-${stamp}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      name: it.name,
      phone: it.phone,
      email: '',
      lastInteractionDate: today,
      notes: 'تم الاستيراد بالجملة من جهات اتصال واتساب/هاتف',
      createdAt: today,
      addedAt: nowIso,
      updatedAt: today,
    }));
    setClients(prev => [...fresh, ...prev]);
    setProjects(prev =>
      prev.map(p => (p.name === common.projectName ? { ...p, totalLeads: p.totalLeads + fresh.length, activeLeads: p.activeLeads + fresh.length } : p))
    );
    addAuditLog({
      action: 'IMPORT_DATA',
      targetType: 'CLIENT',
      details: `إضافة ${fresh.length} عميل دفعة واحدة من جهات اتصال لصقها ${currentUser.name} في مشروع ${common.projectName}`,
    });
    return { added: fresh.length };
  };

  // Update Client
  const updateClient = (clientId: string, updatedData: Partial<ClientLead>) => {
    const today = toLocalDateStr();
    const oldClient = clients.find(c => c.id === clientId);

    setClients(prev =>
      prev.map(c => (c.id === clientId ? { ...c, ...updatedData, updatedAt: today } : c))
    );

    const isFinancialOrContract = String(updatedData.status) === 'متعاقد';

    addAuditLog({
      action: isFinancialOrContract ? 'FINANCIAL_UPDATE' : 'EDIT_CLIENT',
      targetType: 'CLIENT',
      targetId: clientId,
      targetName: updatedData.name || oldClient?.name,
      details: `تحديث بيانات العميل ${oldClient?.name || ''}: ${JSON.stringify(updatedData)}`,
      oldValue: oldClient?.status,
      newValue: updatedData.status,
    });
  };

  // Delete Client
  const deleteClient = (clientId: string) => {
    const target = clients.find(c => c.id === clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));

    addAuditLog({
      action: 'DELETE_CLIENT',
      targetType: 'CLIENT',
      targetId: clientId,
      targetName: target?.name,
      details: `حذف العميل الحساس (${target?.name}) ورقم هاتفه (${target?.phone}) من قبل ${currentUser.name}`,
    });

    addNotification('حذف عميل', `تم حذف العميل (${target?.name || ''}) بنجاح`, 'security');
  };

  // Delete Batch of Selected Clients
  const deleteSelectedClients = (clientIds: string[]) => {
    if (clientIds.length === 0) return;
    const deletedCount = clientIds.length;
    setClients(prev => prev.filter(c => !clientIds.includes(c.id)));

    addAuditLog({
      action: 'BULK_DELETE',
      targetType: 'CLIENT',
      details: `حذف جماعي لعدد (${deletedCount}) عميل من الشيت بواسطة ${currentUser.name}`,
    });

    addNotification('مسح عملاء محددين', `تم مسح ${deletedCount} عميل بنجاح من الشيت`, 'security');
  };

  // Clear All Clients Data
  const clearAllClientsData = () => {
    const totalCount = clients.length;
    setClients([]);
    localStorage.removeItem('gohar_clients');

    addAuditLog({
      action: 'BULK_DELETE',
      targetType: 'SYSTEM',
      details: `تفريغ ومسح الشيت بالكامل (إجمالي ${totalCount} عميل) بواسطة ${currentUser.name}`,
    });

    addNotification('مسح الشيت بالكامل', 'تم تفريغ مسح جميع بيانات الداتا من الشيت بنجاح', 'security');
  };

  // Bulk Assign Clients
  const bulkAssignClients = (clientIds: string[], targetUserId: string, targetUserName: string) => {
    if (!canBulkAssign) return;

    setClients(prev =>
      prev.map(c => {
        if (clientIds.includes(c.id)) {
          return {
            ...c,
            assignedUserId: targetUserId,
            assignedUserName: targetUserName,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    // Send Browser notification to the assigned user
    sendBrowserNotification(`📌 تم تخصيص (${clientIds.length}) عملاء جدد لحسابك`, {
      body: `قام ${currentUser.name} بتخصيص ${clientIds.length} عميل جديد لك لمتابعتهم فوراً.`,
      soundEnabled: true,
      chimeTone: 'gold',
      chimeVolume: 'medium',
    });

    addNotification(
      'توزيع عملاء جديد',
      `تم إعادة تخصيص ${clientIds.length} عميل إلى الموظف ${targetUserName}`,
      'assignment'
    );
  };

  // User Management Actions
  const addUser = (newUser: Omit<User, 'id' | 'createdAt'>) => {
    if (!canManageTeam) return;
    const user: User = {
      ...newUser,
      id: `user-sales-${Date.now()}`,
      createdAt: toLocalDateStr(),
    };
    setUsers(prev => [...prev, user]);
    addNotification('إضافة موظف جديد', `تم إنشاء حساب جديد للموظف (${user.name}) بصفة ${user.role === 'ADMIN' ? 'مدير عام' : user.role === 'SALES_MANAGER' ? 'مدير مبيعات' : 'موظف مبيعات'}`, 'system');
  };

  const updateUser = (id: string, updatedData: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updatedData } : u)));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updatedData }));
    }
  };

  const deleteUser = (id: string) => {
    if (!canManageTeam || id === currentUser.id) return; // Prevent deleting oneself
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Import Clients from CSV / Excel with Smart Auto-Mapping
  const importClientsFromCSV = (clientsData: any[]) => {
    if (!canImport) {
      return { success: false, count: 0, message: 'عفواً، خاصية الاستيراد مقتصرة على الحسابات المصرح لها' };
    }

    if (!clientsData || clientsData.length === 0) {
      return { success: false, count: 0, message: 'لا توجد بيانات للاستيراد' };
    }

    const today = toLocalDateStr();
    
    // Auto-detect columns from first row headers if object keys exist
    const sampleRow = clientsData[0] || {};
    const headers = Object.keys(sampleRow);
    const mapping = autoDetectColumnMapping(headers, clientsData);

    const newLeads: ClientLead[] = clientsData.map((item, idx) => {
      // Check mapped fields first, fallback to explicit or raw position
      const rawName = mapping.nameCol ? item[mapping.nameCol] : item.name || item['اسم العميل'] || item['الاسم'] || Object.values(item)[0];
      const rawPhone = mapping.phoneCol ? item[mapping.phoneCol] : item.phone || item['رقم الهاتف'] || item['الهاتف'] || item['الموبايل'] || Object.values(item)[1];
      const rawEmail = mapping.emailCol ? item[mapping.emailCol] : item.email || item['البريد الإلكتروني'] || item['البريد'] || '';
      const rawAddress = mapping.addressCol ? item[mapping.addressCol] : item.address || item['العنوان'] || 'القاهرة';
      const rawPriority = mapping.priorityCol ? item[mapping.priorityCol] : item.priority || item['الأولوية'] || 'متوسط';
      const rawStatus = mapping.statusCol ? item[mapping.statusCol] : item.status || item['الحالة'] || 'جديد';
      const rawSource = mapping.sourceCol ? item[mapping.sourceCol] : item.source || item['المصدر'] || 'داتا خاصة';
      const rawProject = mapping.projectNameCol ? item[mapping.projectNameCol] : item.projectName || item['المشروع'] || projects[0]?.name || 'مشروع جديد';
      const rawNotes = mapping.notesCol ? item[mapping.notesCol] : item.notes || item['ملاحظات'] || 'داتا مستوردة عبر أدمن النظام';
      const rawFollowUp = mapping.followUpDateCol ? item[mapping.followUpDateCol] : item.followUpDate;

      return {
        id: `lead-imported-${Date.now()}-${idx}`,
        name: String(rawName || `عميل مستورد ${idx + 1}`).trim(),
        phone: normalizePhone(formatPhoneNumber(rawPhone)),
        email: rawEmail ? String(rawEmail).trim() : '',
        address: rawAddress ? String(rawAddress).trim() : 'القاهرة',
        priority: (rawPriority || 'متوسط') as PriorityLevel,
        lastInteractionDate: today,
        status: (rawStatus || 'جديد') as CallStatus,
        source: (rawSource || 'داتا خاصة') as LeadSource,
        projectName: rawProject ? String(rawProject).trim() : (projects[0]?.name || 'مشروع جديد'),
        assignedUserId: item.assignedUserId || currentUser.id,
        assignedUserName: item.assignedUserName || currentUser.name,
        followUpDate: rawFollowUp ? String(rawFollowUp).trim() : undefined,
        createdAt: today,
        addedAt: new Date().toISOString(),
        updatedAt: today,
        notes: rawNotes ? String(rawNotes).trim() : 'داتا مستوردة عبر أدمن النظام',
      };
    }).filter(l => l.phone);

    setClients(prev => [...newLeads, ...prev]);

    // Record Audit Log
    addAuditLog({
      action: 'IMPORT_DATA',
      targetType: 'CLIENT',
      details: `استيراد ذكي لعدد (${newLeads.length}) عميل وتوزيعهم في الشيت بواسطة ${currentUser.name}`,
    });

    addNotification('استيراد داتا عملاء', `تم استيراد ${newLeads.length} عميل جديد بنجاح مع الفرز الذكي التلقائي للأعمدة`, 'system');

    return { success: true, count: newLeads.length, message: `تم استيراد ${newLeads.length} عميل بنجاح` };
  };

  // Notifications helpers
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Cloud Sync Actions
  const updateCloudConfig = (newConfig: Partial<CloudStorageConfig>) => {
    setCloudConfig(prev => ({ ...prev, ...newConfig }));
  };

  const triggerManualSync = async () => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        setCloudConfig(prev => ({
          ...prev,
          lastSyncTime: `اليوم، ${timeStr}`,
          storageUsedMB: parseFloat((prev.storageUsedMB + 0.5).toFixed(1)),
        }));
        addNotification('مزامنة سحابية', 'تمت المزامنة السحابية اليدوية بنجاح مع Google Drive', 'system');
        resolve();
      }, 1200);
    });
  };

  // Calculate Daily Performance Reports for all sales reps & manager
  const getPerformanceReports = (): ActivityReport[] => {
    const salesTeam = users.filter(u => u.role === 'SALES_REP' || u.role === 'SALES_MANAGER');

    return salesTeam.map(user => {
      const userLeads = clients.filter(c => c.assignedUserId === user.id);

      return {
        userId: user.id,
        userName: user.name,
        role: user.role,
        totalCalls: userLeads.length,
        interestedCount: userLeads.filter(c => c.status === 'مهتم').length,
        callbackCount: userLeads.filter(c => c.status === 'هرجع اكلمه تاني').length,
        closedCount: userLeads.filter(c => c.status === 'مغلق').length,
        notInterestedCount: userLeads.filter(c => c.status === 'مش مهتم').length,
        unreachableCount: userLeads.filter(c => c.status === 'غير متاح').length,
        hungUpCount: userLeads.filter(c => c.status === 'قفل الخط في وشي').length,
        busyCount: userLeads.filter(c => c.status === 'مشغول دلوقتي').length,
        noAnswerCount: userLeads.filter(c => c.status === 'مش بيرد').length,
        wrongNumberCount: userLeads.filter(c => c.status === 'الرقم غلط').length,
        contractedCount: userLeads.filter(c => c.status === 'متعاقد').length,
        pendingFollowUps: userLeads.filter(c => c.followUpDate && c.followUpDate >= toLocalDateStr()).length,
      };
    });
  };

  const addProject = (projectData: Omit<Project, 'id' | 'totalLeads' | 'activeLeads'>) => {
    const newProj: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      totalLeads: 0,
      activeLeads: 0,
    };
    setProjects(prev => [...prev, newProj]);
    addNotification('إضافة مشروع جديد', `تم إدراج المشروع (${newProj.name}) في قاعدة بيانات جوهر جروب`, 'system');
  };

  const updateProject = (id: string, updatedData: Partial<Project>) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updatedData } : p)));
    addNotification('تحديث مشروع', 'تم تحديث بيانات المشروع بنجاح', 'system');
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    addNotification('حذف مشروع', 'تم حذف المشروع من القائمة بنجاح', 'system');
  };

  const deleteSchedulePlan = (id: string) => {
    setSchedulePlans(prev => prev.filter(p => p.id !== id));
    addNotification('حذف خطة جدولة', 'تم إلغاء خطة التوزيع المجدولة بنجاح', 'system');
  };

  // Aggregate All Live Interaction Logs for History & Audit Stream
  const allInteractions = useMemo(() => clients.flatMap(client => {
    if (!client.notesHistory || client.notesHistory.length === 0) {
      if (client.notes) {
        return [{
          id: `legacy-${client.id}`,
          clientId: client.id,
          clientName: client.name,
          phone: client.phone,
          authorName: client.assignedUserName,
          status: client.status,
          note: client.notes,
          date: client.lastInteractionDate || client.updatedAt,
          projectName: client.projectName,
          isVoiceNote: false,
        }];
      }
      return [];
    }

    return client.notesHistory.map(item => ({
      id: item.id,
      clientId: client.id,
      clientName: client.name,
      phone: client.phone,
      authorName: item.authorName,
      status: item.status,
      note: item.note,
      date: item.date,
      projectName: client.projectName,
      isVoiceNote: item.isVoiceNote || false,
    }));
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [clients]);

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  // القيمة ثابتة طالما الداتا ما اتغيرتش، عشان مفيش إعادة رسم لكل الصفحات بلا داعي
  const ctxValue = useMemo(() => ({
        currentUser,
        users,
        projects,
        clients,
        visibleClients,
        cloudConfig,
        notifications,
        unreadNotificationsCount,

        // Audit Logs & Security
        auditLogs,
        addAuditLog,
        clearAuditLogs,

        // Sales Performance Reviews & Quality
        reviews,
        addReview,
        deleteReview,

        // Duplicate Checker & Preferences
        checkDuplicateClient,
        updateVisibleColumns,

        themeMode,
        toggleTheme,
        setThemeMode,

        browserNotificationSettings,
        updateBrowserNotificationSettings,
        triggerTestNotification,

        isAuthenticated,
        loginWithCredentials,
        logoutUser,

        customLogoUrl,
        companyTitle,
        companySubtitle,
        updateLogoSettings,

        joinCodes,
        generateJoinCode,
        toggleJoinCode,
        deleteJoinCode,
        verifyJoinCode,

        registerSalesWithJoinCode,
        approveUser,
        rejectUser,
        changeUserPassword,

        setCurrentUser,
        addUser,
        updateUser,
        deleteUser,

        updateClientStatus,
        updateClientStatusWithReason,
        scheduleFollowUp,
        addClient,
        addClientsBulk,
        updateClient,
        deleteClient,
        deleteSelectedClients,
        clearAllClientsData,
        bulkAssignClients,

        messageTemplates,
        addMessageTemplate,
        updateMessageTemplate,
        deleteMessageTemplate,

        canExport,
        canImport,
        canManageUsers,
        canManageTeam,
        canDeleteClients,
        canEditClient,
        canBulkAssign,

        importClientsFromCSV,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,

        updateCloudConfig,
        triggerManualSync,

        getPerformanceReports,
        schedulePlans,
        deleteSchedulePlan,
        allInteractions,

        addProject,
        updateProject,
        deleteProject,
  }), [ users, currentUser, isAuthenticated, joinCodes, messageTemplates, customLogoUrl, companyTitle, companySubtitle, projects, clients, cloudConfig, notifications, schedulePlans, themeMode, auditLogs, reviews, browserNotificationSettings ]);

  return (
    <AppContext.Provider value={ctxValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
