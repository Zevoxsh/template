import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { generateState, exchangeCodeForToken, fetchUserInfo } from "../lib/oauth";
import { ldapAuthenticate } from "../lib/ldap";
import { signAccessToken, signRefreshToken } from "../lib/jwt";
import { hashPassword } from "../lib/password";
import { AppError } from "../middleware/error.middleware";
import { TokenType } from "@prisma/client";
import { config } from "../config";

const router = Router();

const IS_PROD = config.nodeEnv === "production";
const COOKIE_OPTS = { httpOnly: true, secure: IS_PROD, sameSite: "lax" as const, path: "/" };

async function issueTokens(res: Response, userId: string, email: string, role: string, name: string) {
  const accessToken = signAccessToken({ sub: userId, email, role, name });
  const refreshToken = signRefreshToken(userId);
  await prisma.token.create({
    data: { userId, type: TokenType.REFRESH, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });
  res.cookie("access_token", accessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
  res.cookie("refresh_token", refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

// GET /api/auth/providers — liste les providers activés (public)
router.get("/providers", async (_req, res, next) => {
  try {
    const providers = await prisma.oAuthProvider.findMany({
      where: { enabled: true },
      select: { name: true, displayName: true, iconUrl: true },
    });
    const ldap = await prisma.ldapConfig.findUnique({ where: { id: "singleton" } });
    res.json({
      local: true,
      oauth: providers,
      ldap: ldap?.enabled ?? false,
    });
  } catch (err) { next(err); }
});

// GET /api/auth/oauth/:provider — démarre le flow OAuth
router.get("/oauth/:provider", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = await prisma.oAuthProvider.findUnique({ where: { name: String(req.params.provider) } });
    if (!provider?.enabled) throw new AppError(404, "Provider not found or disabled");

    const state = generateState();
    res.cookie("oauth_state", state, { ...COOKIE_OPTS, maxAge: 10 * 60 * 1000 });

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: `${config.frontendUrl}/api/auth/oauth/${provider.name}/callback` as string,
      response_type: "code",
      scope: provider.scope,
      state,
    });

    res.redirect(`${provider.authUrl}?${params}`);
  } catch (err) { next(err); }
});

// GET /api/auth/oauth/:provider/callback
router.get("/oauth/:provider/callback", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    const error = req.query.error as string | undefined;

    if (error) throw new AppError(400, `OAuth error: ${error}`);
    if (!code) throw new AppError(400, "Missing OAuth code");

    const storedState = req.cookies?.oauth_state as string | undefined;
    if (!storedState || storedState !== state) throw new AppError(400, "Invalid OAuth state");
    res.clearCookie("oauth_state", COOKIE_OPTS);

    const provider = await prisma.oAuthProvider.findUnique({ where: { name: String(req.params.provider) } });
    if (!provider?.enabled) throw new AppError(404, "Provider not found");

    const redirectUri = `${config.frontendUrl}/api/auth/oauth/${provider.name}/callback`;
    const accessToken = await exchangeCodeForToken(provider, code!, redirectUri);
    const userInfo = await fetchUserInfo(provider.userInfoUrl, accessToken);

    if (!userInfo.email) throw new AppError(400, "Provider did not return an email address");

    // Find or create user
    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: provider.name, providerAccountId: userInfo.id } },
      include: { user: true },
    });

    let user = oauthAccount?.user ?? null;

    if (!user) {
      // Check if email already exists
      user = await prisma.user.findUnique({ where: { email: userInfo.email } }) ?? null;

      if (user) {
        // Link OAuth account to existing user
        await prisma.oAuthAccount.create({
          data: { userId: user.id, provider: provider.name, providerAccountId: userInfo.id },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            name: userInfo.name,
            email: userInfo.email,
            password: await hashPassword(crypto.randomUUID()),
            emailVerified: true,
            oauthAccounts: { create: { provider: provider.name, providerAccountId: userInfo.id } },
          },
        });
      }
    }

    if (user.banned) return res.redirect(`${config.frontendUrl}/login?error=banned`);

    await issueTokens(res, user.id, user.email, user.role, user.name);
    res.redirect(`${config.frontendUrl}/dashboard`);
  } catch (err) { next(err); }
});

// POST /api/auth/ldap — login LDAP
router.post("/ldap", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) throw new AppError(400, "Username and password required");

    const ldapConfig = await prisma.ldapConfig.findUnique({ where: { id: "singleton" } });
    if (!ldapConfig?.enabled) throw new AppError(404, "LDAP not enabled");

    const ldapUser = await ldapAuthenticate(ldapConfig, username, password);

    const email = ldapUser.email ?? `${username}@ldap.local`;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: ldapUser.name ?? username,
          email,
          password: await hashPassword(crypto.randomUUID()),
          emailVerified: true,
        },
      });
    }

    if (user.banned) throw new AppError(403, `Account banned: ${user.bannedReason ?? "contact support"}`);

    await issueTokens(res, user.id, user.email, user.role, user.name);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

export default router;
