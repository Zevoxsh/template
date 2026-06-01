import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { prisma } from "../lib/prisma";
import { PRESET_PROVIDERS } from "../lib/oauth";
import { AppError } from "../middleware/error.middleware";

const router = Router();
router.use(authenticate, requireRole("ADMIN"));

// GET /api/admin/auth-config
router.get("/", async (_req, res, next) => {
  try {
    const [oauthProviders, ldap] = await Promise.all([
      prisma.oAuthProvider.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.ldapConfig.findUnique({ where: { id: "singleton" } }),
    ]);
    res.json({ oauthProviders, ldap: ldap ?? null, presets: Object.keys(PRESET_PROVIDERS) });
  } catch (err) { next(err); }
});

// PUT /api/admin/auth-config/oauth/:name
router.put("/oauth/:name", async (req, res, next) => {
  try {
    const name = req.params.name as string;
    const { enabled, clientId, clientSecret, displayName, authUrl, tokenUrl, userInfoUrl, scope, iconUrl } = req.body;

    const preset = PRESET_PROVIDERS[name];
    const provider = await prisma.oAuthProvider.upsert({
      where: { name },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(clientId !== undefined && { clientId }),
        ...(clientSecret !== undefined && { clientSecret }),
        ...(displayName !== undefined && { displayName }),
        ...(authUrl !== undefined && { authUrl }),
        ...(tokenUrl !== undefined && { tokenUrl }),
        ...(userInfoUrl !== undefined && { userInfoUrl }),
        ...(scope !== undefined && { scope }),
        ...(iconUrl !== undefined && { iconUrl }),
      },
      create: {
        name,
        displayName: displayName ?? preset?.displayName ?? name,
        enabled: enabled ?? false,
        clientId: clientId ?? "",
        clientSecret: clientSecret ?? "",
        authUrl: authUrl ?? preset?.authUrl ?? "",
        tokenUrl: tokenUrl ?? preset?.tokenUrl ?? "",
        userInfoUrl: userInfoUrl ?? preset?.userInfoUrl ?? "",
        scope: scope ?? preset?.scope ?? "",
        iconUrl: iconUrl ?? preset?.iconUrl ?? null,
      },
    });
    res.json({ provider });
  } catch (err) { next(err); }
});

// DELETE /api/admin/auth-config/oauth/:name
router.delete("/oauth/:name", async (req, res, next) => {
  try {
    await prisma.oAuthProvider.delete({ where: { name: req.params.name } });
    res.json({ message: "Provider deleted" });
  } catch (err) { next(err); }
});

// PUT /api/admin/auth-config/ldap
router.put("/ldap", async (req, res, next) => {
  try {
    const { enabled, host, port, bindDn, bindPassword, searchBase, searchFilter, useTls } = req.body;
    const ldap = await prisma.ldapConfig.upsert({
      where: { id: "singleton" },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(host !== undefined && { host }),
        ...(port !== undefined && { port: Number(port) }),
        ...(bindDn !== undefined && { bindDn }),
        ...(bindPassword !== undefined && { bindPassword }),
        ...(searchBase !== undefined && { searchBase }),
        ...(searchFilter !== undefined && { searchFilter }),
        ...(useTls !== undefined && { useTls }),
      },
      create: {
        id: "singleton",
        enabled: enabled ?? false,
        host: host ?? "",
        port: port ? Number(port) : 389,
        bindDn: bindDn ?? "",
        bindPassword: bindPassword ?? "",
        searchBase: searchBase ?? "",
        searchFilter: searchFilter ?? "(uid={{username}})",
        useTls: useTls ?? false,
      },
    });
    res.json({ ldap });
  } catch (err) { next(err); }
});

export default router;
