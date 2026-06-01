export type Role = "USER" | "MODERATOR" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  avatarUrl?: string | null;
  avatarFlagged?: boolean;
  banned?: boolean;
  bannedReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  registrationEnabled: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
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
