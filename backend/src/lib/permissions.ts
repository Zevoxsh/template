export const ALL_PERMISSIONS = [
  "users.view",
  "users.edit",
  "users.delete",
  "users.ban",
  "roles.manage",
  "settings.view",
  "settings.edit",
  "content.view",
  "content.create",
  "content.edit",
  "content.delete",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [...ALL_PERMISSIONS],
  MODERATOR: ["users.view", "users.ban", "content.view", "content.edit"],
  USER: ["content.view", "content.create"],
};
