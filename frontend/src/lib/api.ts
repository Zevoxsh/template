import { ApiError } from "@/types";

class ApiClient {
  private base = "/api";

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      credentials: "include",
    });

    if (!res.ok) {
      const data: ApiError = await res.json().catch(() => ({ error: "Unknown error" }));
      throw Object.assign(new Error(data.error), { status: res.status, details: data.details });
    }

    return res.json() as Promise<T>;
  }

  // Auth
  auth = {
    register: (body: { name: string; email: string; password: string }) =>
      this.request<{ message: string }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      this.request<{ user?: import("@/types").User; twoFactorRequired?: boolean; challengeToken?: string; method?: string | null }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

    logout: () =>
      this.request<{ message: string }>("/auth/logout", { method: "POST" }),

    me: () =>
      this.request<{ user: import("@/types").User }>("/auth/me"),

    forgotPassword: (email: string) =>
      this.request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

    resetPassword: (token: string, password: string) =>
      this.request<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),

    verifyEmail: (token: string) =>
      this.request<{ message: string }>(`/auth/verify-email?token=${token}`),

    twoFactor: {
      verifyChallenge: (challengeToken: string, code: string) =>
        this.request<{ user: import("@/types").User }>("/auth/2fa/verify", { method: "POST", body: JSON.stringify({ challengeToken, code }) }),

      sendEmailOtp: (challengeToken: string) =>
        this.request<{ message: string }>("/auth/2fa/email/send", { method: "POST", body: JSON.stringify({ challengeToken }) }),

      totpSetup: () =>
        this.request<{ secret: string; qrCode: string; uri: string }>("/auth/2fa/totp/setup", { method: "POST" }),

      totpActivate: (code: string) =>
        this.request<{ backupCodes: string[] }>("/auth/2fa/totp/activate", { method: "POST", body: JSON.stringify({ code }) }),

      emailSetup: () =>
        this.request<{ message: string }>("/auth/2fa/email/setup", { method: "POST" }),

      emailActivate: (code: string) =>
        this.request<{ backupCodes: string[] }>("/auth/2fa/email/activate", { method: "POST", body: JSON.stringify({ code }) }),

      disable: () =>
        this.request<{ message: string }>("/auth/2fa/disable", { method: "POST" }),

      regenerateBackupCodes: () =>
        this.request<{ backupCodes: string[] }>("/auth/2fa/backup-codes/regenerate", { method: "POST" }),
    },
  };

  // User
  user = {
    getProfile: () =>
      this.request<{ user: import("@/types").User; oauthAccounts: { provider: string }[] }>("/user/profile"),

    updateProfile: (body: { name: string }) =>
      this.request<{ user: import("@/types").User }>("/user/profile", { method: "PUT", body: JSON.stringify(body) }),

    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      this.request<{ message: string }>("/user/password", { method: "PUT", body: JSON.stringify(body) }),

    changeEmail: (body: { email: string; password: string }) =>
      this.request<{ user: import("@/types").User }>("/user/email", { method: "PUT", body: JSON.stringify(body) }),

    unlinkConnection: (provider: string) =>
      this.request<{ message: string }>(`/user/connections/${provider}`, { method: "DELETE" }),

    getSessions: () =>
      this.request<{ sessions: import("@/types").Session[] }>("/user/sessions"),

    revokeSession: (id: string) =>
      this.request<{ message: string }>(`/user/sessions/${id}`, { method: "DELETE" }),

    revokeAllSessions: () =>
      this.request<{ message: string }>("/user/sessions", { method: "DELETE" }),

    deleteAccount: (password: string) =>
      this.request<{ message: string }>("/user/account", { method: "DELETE", body: JSON.stringify({ password }) }),

    exportData: () =>
      fetch("/api/user/export", { credentials: "include" }).then(r => r.blob()),

    getNotifPrefs: () =>
      this.request<{ notifPrefs: { security: boolean; updates: boolean; marketing: boolean } }>("/user/notif-prefs"),

    updateNotifPrefs: (prefs: { security: boolean; updates: boolean; marketing: boolean }) =>
      this.request<{ notifPrefs: any }>("/user/notif-prefs", { method: "PUT", body: JSON.stringify(prefs) }),

    completeOnboarding: () =>
      this.request<{ message: string }>("/user/onboarding/complete", { method: "POST" }),

    getNotifications: (unreadOnly = false) =>
      this.request<{ notifications: import("@/types").Notification[] }>(`/user/notifications${unreadOnly ? "?unread=true" : ""}`),

    markNotificationRead: (id: string) =>
      this.request<{ message: string }>(`/user/notifications/${id}/read`, { method: "POST" }),

    markAllNotificationsRead: () =>
      this.request<{ message: string }>("/user/notifications/read-all", { method: "POST" }),
  };

  // Admin
  admin = {
    getStats: () =>
      this.request<import("@/types").AdminStats>("/admin/stats"),

    listUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; banned?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.search) q.set("search", params.search);
      if (params?.role) q.set("role", params.role);
      if (params?.banned !== undefined) q.set("banned", String(params.banned));
      return this.request<import("@/types").PaginatedUsers>(`/admin/users?${q}`);
    },

    getUser: (id: string) =>
      this.request<{ user: import("@/types").User }>(`/admin/users/${id}`),

    updateUser: (id: string, body: Partial<{ role: string; banned: boolean; bannedReason: string; emailVerified: boolean }>) =>
      this.request<{ user: import("@/types").User }>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),

    createUser: (body: { name: string; email: string; role: string; password?: string }) =>
      this.request<{ user: import("@/types").User; passwordSet: boolean; message?: string }>("/admin/users", { method: "POST", body: JSON.stringify(body) }),

    deleteUser: (id: string) =>
      this.request<{ message: string }>(`/admin/users/${id}`, { method: "DELETE" }),

    sendPasswordReset: (id: string) =>
      this.request<{ message: string }>(`/admin/users/${id}/reset-password`, { method: "POST" }),

    sendEmailVerification: (id: string) =>
      this.request<{ message: string }>(`/admin/users/${id}/send-verification`, { method: "POST" }),

    resetUserAvatar: (id: string) =>
      this.request<{ user: import("@/types").User }>(`/admin/users/${id}/reset-avatar`, { method: "POST" }),

    bulkAction: (action: string, userIds: string[], data?: object) =>
      this.request<{ message: string }>("/admin/users/bulk", { method: "POST", body: JSON.stringify({ action, userIds, ...data }) }),

    getAuditLogs: (params?: { page?: number; action?: string; actorId?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.action) q.set("action", params.action);
      if (params?.actorId) q.set("actorId", params.actorId);
      return this.request<{ logs: import("@/types").AuditLog[]; total: number; page: number; totalPages: number }>(`/admin/audit-logs?${q}`);
    },

    getDetailedStats: (days = 30) =>
      this.request<any>(`/admin/stats?days=${days}`),

    exportUsersCsv: () =>
      fetch("/api/admin/users/export/csv", { credentials: "include" }).then(r => r.blob()),

    getRateLimitBlocks: () =>
      this.request<{ blocks: import("@/types").RateLimitBlock[] }>("/admin/rate-limits"),

    unblockIp: (id: string) =>
      this.request<{ message: string }>(`/admin/rate-limits/${id}/unblock`, { method: "POST" }),

    broadcastNotification: (body: { title: string; body: string; link?: string; type?: string }) =>
      this.request<{ message: string }>("/admin/notifications/broadcast", { method: "POST", body: JSON.stringify(body) }),

    getSettings: () =>
      this.request<{ settings: import("@/types").SiteSettings }>("/admin/settings"),

    updateSettings: (body: Partial<import("@/types").SiteSettings>) =>
      this.request<{ settings: import("@/types").SiteSettings }>("/admin/settings", { method: "PUT", body: JSON.stringify(body) }),

    getRoles: () =>
      this.request<{ permissions: Record<string, string[]>; available: string[] }>("/admin/roles"),

    updateRolePermissions: (role: string, permissions: string[]) =>
      this.request<{ role: string; permissions: string[] }>(`/admin/roles/${role}`, { method: "PUT", body: JSON.stringify({ permissions }) }),

    resetPermissions: () =>
      this.request<{ message: string }>("/admin/roles/reset", { method: "POST" }),

    getAuthConfig: () =>
      this.request<{ oauthProviders: any[]; ldap: any; presets: string[] }>("/admin/auth-config"),

    saveOAuthProvider: (name: string, body: object) =>
      this.request<{ provider: any }>(`/admin/auth-config/oauth/${name}`, { method: "PUT", body: JSON.stringify(body) }),

    deleteOAuthProvider: (name: string) =>
      this.request<{ message: string }>(`/admin/auth-config/oauth/${name}`, { method: "DELETE" }),

    saveLdap: (body: object) =>
      this.request<{ ldap: any }>("/admin/auth-config/ldap", { method: "PUT", body: JSON.stringify(body) }),

    testSmtp: () =>
      this.request<{ ok: boolean; message?: string; error?: string }>("/admin/test-smtp", { method: "POST" }),
  };
}

export const api = new ApiClient();
