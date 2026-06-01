import crypto from "crypto";
import { prisma } from "./prisma";

export const PRESET_PROVIDERS: Record<string, { displayName: string; authUrl: string; tokenUrl: string; userInfoUrl: string; scope: string; iconUrl: string }> = {
  google: {
    displayName: "Google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: "openid email profile",
    iconUrl: "https://www.google.com/favicon.ico",
  },
  github: {
    displayName: "GitHub",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    scope: "read:user user:email",
    iconUrl: "https://github.com/favicon.ico",
  },
  discord: {
    displayName: "Discord",
    authUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userInfoUrl: "https://discord.com/api/users/@me",
    scope: "identify email",
    iconUrl: "https://discord.com/favicon.ico",
  },
  microsoft: {
    displayName: "Microsoft",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userInfoUrl: "https://graph.microsoft.com/v1.0/me",
    scope: "openid email profile",
    iconUrl: "https://www.microsoft.com/favicon.ico",
  },
};

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function exchangeCodeForToken(
  provider: { tokenUrl: string; clientId: string; clientSecret: string },
  code: string,
  redirectUri: string
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
  });

  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
  });

  const data = await res.json() as Record<string, unknown>;
  if (!data.access_token) throw new Error("OAuth token exchange failed");
  return data.access_token as string;
}

export async function fetchUserInfo(userInfoUrl: string, accessToken: string): Promise<{ id: string; email: string | null; name: string }> {
  const res = await fetch(userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json() as Record<string, unknown>;

  // Normalize across providers
  const id = String(data.id ?? data.sub ?? "");
  const email = (data.email ?? data.mail ?? undefined) as string | undefined;
  const name = String(data.name ?? data.login ?? data.username ?? data.displayName ?? "User");

  if (!id) throw new Error("Could not get user ID from provider");
  return { id, email: email ?? null, name };
}
