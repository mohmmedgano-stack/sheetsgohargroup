export type UserRole = 'ADMIN' | 'SALES_MANAGER' | 'SALES_REP';
export type ThemeMode = 'dark' | 'light';

export interface UserPermissions {
  canExport: boolean;
  canImport: boolean;
  canDeleteClients: boolean;
  canEditClientDetails: boolean;
  canViewAllProjects: boolean;
  canBulkAssign: boolean;
  canSendWhatsApp: boolean;
  canRecordVoiceNotes: boolean;
  canViewDistanceMap: boolean;
  canManageTeam?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  assignedProject?: string; // اسم المشروع الأساسي الموكل إليه
  activeStatus: 'active' | 'inactive' | 'pending_approval'; // مفعل أو معطل أو في انتظار موافقة المدير
  permissions?: UserPermissions; // الصلاحيات المخصصة
  joinCodeUsed?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  visibleColumns?: string[]; // الأعمدة المفضلة للجدول
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'DELETE_CLIENT' | 'BULK_DELETE' | 'EDIT_CLIENT' | 'FINANCIAL_UPDATE' | 'PERMISSIONS_UPDATE' | 'STATUS_CHANGE' | 'IMPORT_DATA' | 'EXPORT_DATA' | 'USER_APPROVED' | 'PASSWORD_RESET' | 'REVIEW_ADDED';
  targetType: 'CLIENT' | 'USER' | 'FINANCIAL' | 'SYSTEM';
  targetId?: string;
  targetName?: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

export interface SalesPerformanceReview {
  id: string;
  repId: string;
  repName: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1 to 5 stars
  category: 'CALL_QUALITY' | 'NOTES_ACCURACY' | 'CLOSING_SKILLS' | 'CUSTOMER_HANDLING' | 'GENERAL';
  comment: string;
  clientId?: string;
  clientName?: string;
  callDate?: string;
  createdAt: string;
  weekNumber?: number;
}

export interface TeamJoinCode {
  code: string;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
  description?: string;
}

export type CallStatus = 
  | 'مش مهتم' 
  | 'مغلق' 
  | 'غير متاح' 
  | 'قفل الخط في وشي' 
  | 'هرجع اكلمه تاني' 
  | 'مشغول دلوقتي' 
  | 'مهتم'
  | 'مش بيرد'
  | 'الرقم مقفول'
  | 'الرقم غلط'
  | 'متعاقد'
  | 'جديد';

export type LeadSource = 'اعلانات فيسبوك' | 'داتا خاصة' | 'اوت دور';

export type PriorityLevel = 'عالي' | 'متوسط' | 'منخفض';

export interface InteractionNote {
  id: string;
  date: string;
  /** ISO timestamp (new interactions); `date` stays the legacy Arabic string. */
  at?: string;
  status: CallStatus;
  note: string;
  authorName: string;
  authorRole?: UserRole;
  isVoiceNote?: boolean;
}

export interface LocationInfo {
  lat?: number;
  lng?: number;
  addressLabel?: string;
  distanceFromHQKm?: number;
  driveTimeMinutes?: number;
}

export interface MessageTemplate {
  id: string;
  title: string;
  category: 'ترحيب' | 'متابعة' | 'عروض_وأسعار' | 'اعتذار_إعادة_اتصال' | 'عام';
  content: string;
  isDefault?: boolean;
}

export interface ClientLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  priority: PriorityLevel;
  lastInteractionDate: string;
  status: CallStatus;
  source: LeadSource;
  projectName: string;
  assignedUserId: string; // ID اليوزر المخصص له العميل
  assignedUserName: string;
  followUpDate?: string; // YYYY-MM-DD
  followUpTime?: string; // HH:mm
  notes?: string;
  notesHistory?: InteractionNote[];
  location?: LocationInfo;
  createdAt: string;
  /** exact moment the number was added to the CRM (ISO, stamped by the server) */
  addedAt?: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  description: string;
  totalLeads: number;
  activeLeads: number;
  status: 'متاح للبيع' | 'مباع بالكامل' | 'قيد الإنشاء';
  imageUrl?: string;
  coordinates?: { lat: number; lng: number };
}

export interface LeadSchedulePlan {
  id: string;
  userId: string;
  userName: string;
  planType: '7_DAYS' | '30_DAYS'; // جدولة أسبوعية أم شهرية
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalLeadsAllocated: number;
  notes?: string;
  createdAt: string;
}

export interface ActivityReport {
  userId: string;
  userName: string;
  role?: UserRole;
  totalCalls: number;
  interestedCount: number;
  callbackCount: number;
  closedCount: number;
  notInterestedCount: number;
  unreachableCount: number;
  hungUpCount: number;
  busyCount: number;
  noAnswerCount: number;
  wrongNumberCount: number;
  contractedCount: number;
  pendingFollowUps: number;
}

export interface CloudStorageConfig {
  provider: 'Google Drive' | 'OneDrive' | 'Dropbox' | 'Server Storage';
  isConnected: boolean;
  autoSync: boolean;
  lastSyncTime?: string;
  driveFolderUrl?: string;
  storageUsedMB: number;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'followup' | 'assignment' | 'system' | 'security';
  isRead: boolean;
  clientId?: string;
}

export interface BrowserNotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  chimeTone?: 'gold' | 'crystal' | 'dingdong' | 'harp';
  chimeVolume?: 'soft' | 'medium' | 'high';
  advanceMinutes: number; // 0, 15, 30, 60
  notifyOnOverdue: boolean;
  notifyOnHotLeads: boolean;
}

