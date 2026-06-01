// eslint-disable-next-line @typescript-eslint/no-require-imports
const ldap = require("ldapjs") as typeof import("ldapjs");

interface LdapCfg {
  host: string; port: number; bindDn: string; bindPassword: string;
  searchBase: string; searchFilter: string; useTls: boolean;
}

export async function ldapAuthenticate(
  config: LdapCfg,
  username: string,
  password: string,
): Promise<{ dn: string; email?: string; name?: string }> {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: `${config.useTls ? "ldaps" : "ldap"}://${config.host}:${config.port}`,
      ...(config.useTls && { tlsOptions: { rejectUnauthorized: false } }),
    });

    client.on("error", (e: Error) => reject(e));

    client.bind(config.bindDn, config.bindPassword, (err: Error | null) => {
      if (err) { client.destroy(); return reject(new Error("LDAP bind failed")); }

      const filter = config.searchFilter.replace("{{username}}", username);

      client.search(
        config.searchBase,
        { filter, scope: "sub", attributes: ["dn", "mail", "cn", "displayName"] },
        (err: Error | null, res: any) => {
          if (err) { client.destroy(); return reject(err); }

          let found: { dn: string; email?: string; name?: string } | null = null;

          res.on("searchEntry", (entry: any) => {
            const obj = entry.pojo ?? entry.object;
            const getAttr = (type: string): string | undefined => {
              if (entry.pojo) {
                return entry.pojo.attributes.find((a: any) => a.type === type)?.values[0];
              }
              return obj[type];
            };
            found = {
              dn: entry.dn?.toString() ?? obj.dn,
              email: getAttr("mail"),
              name: getAttr("displayName") ?? getAttr("cn"),
            };
          });

          res.on("error", (e: Error) => { client.destroy(); reject(e); });

          res.on("end", () => {
            if (!found) { client.destroy(); return reject(new Error("User not found in LDAP")); }

            client.bind((found as any).dn, password, (err: Error | null) => {
              client.destroy();
              if (err) return reject(new Error("Invalid LDAP credentials"));
              resolve(found!);
            });
          });
        },
      );
    });
  });
}
