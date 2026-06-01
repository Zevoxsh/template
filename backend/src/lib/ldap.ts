import ldap from "ldapjs";

export async function ldapAuthenticate(
  config: { host: string; port: number; bindDn: string; bindPassword: string; searchBase: string; searchFilter: string; useTls: boolean },
  username: string,
  password: string
): Promise<{ dn: string; email?: string; name?: string }> {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: `${config.useTls ? "ldaps" : "ldap"}://${config.host}:${config.port}`,
      tlsOptions: config.useTls ? { rejectUnauthorized: false } : undefined,
    });

    client.on("error", reject);

    client.bind(config.bindDn, config.bindPassword, (err) => {
      if (err) { client.destroy(); return reject(new Error("LDAP bind failed")); }

      const filter = config.searchFilter.replace("{{username}}", username);
      client.search(config.searchBase, { filter, scope: "sub", attributes: ["dn", "mail", "cn", "displayName"] }, (err, res) => {
        if (err) { client.destroy(); return reject(err); }

        let entry: { dn: string; email?: string; name?: string } | null = null;

        res.on("searchEntry", (e) => {
          const obj = e.pojo;
          entry = {
            dn: obj.objectName as string,
            email: (obj.attributes.find((a) => a.type === "mail")?.values[0] as string) ?? undefined,
            name: (obj.attributes.find((a) => a.type === "displayName" || a.type === "cn")?.values[0] as string) ?? undefined,
          };
        });

        res.on("error", (e) => { client.destroy(); reject(e); });

        res.on("end", () => {
          if (!entry) { client.destroy(); return reject(new Error("User not found in LDAP")); }

          client.bind(entry.dn, password, (err) => {
            client.destroy();
            if (err) return reject(new Error("Invalid LDAP credentials"));
            resolve(entry!);
          });
        });
      });
    });
  });
}
