export type Role = "USER" | "MODERATOR" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  avatarUrl?: string | null;
  avatarFlagged?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: string | null;
  onboardingDone?: boolean;
  notifPrefs?: { security: boolean; updates: boolean; marketing: boolean };
  banned?: boolean;
  bannedReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Session {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  lastUsed?: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface AuditLog {
  id: string;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetName?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  createdAt: string;
}

export interface RateLimitBlock {
  id: string;
  ipAddress: string;
  route: string;
  attempts: number;
  blockedAt: string;
  unblockedAt?: string | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface SiteSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  logoUrl?: string | null;
  registrationEnabled: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
  twoFactorPolicy: "DISABLED" | "OPTIONAL" | "REQUIRED";
  twoFactorAllowedMethods: ("totp" | "email")[];
  inactivityTimeout: number;
  announcementEnabled: boolean;
  announcementText: string;
  announcementType: "info" | "warning" | "success" | "error";
  emailTemplates: Record<string, { subject: string; body: string }>;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalModerators: number;
  bannedUsers: number;
  unverifiedUsers: number;
  recentUsers: User[];
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: { path: string; message: string }[];
}
