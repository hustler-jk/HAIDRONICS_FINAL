import "dotenv/config";
import postgres from "postgres";
import { isDirectGoogleAccount } from "../server/admin-provisioning";

type RoleAction = "grant" | "revoke";

async function main() {
  const [action, rawEmail, ...extraArgs] = process.argv.slice(2);
  if ((action !== "grant" && action !== "revoke") || !rawEmail || extraArgs.length > 0) {
    throw new Error("Usage: npm run admin:grant -- email@example.com OR npm run admin:revoke -- email@example.com");
  }

  const email = rawEmail.trim().toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Provide a valid account email address.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required. Keep database credentials server-side.");

  const client = postgres(databaseUrl, { max: 1, prepare: false, ssl: "require" });
  try {
    const result = await client.begin(async (tx) => {
      const [user] = await tx<{ id: number; openId: string; loginMethod: string | null; role: string }[]>`
        SELECT id, "openId", "loginMethod", role
        FROM users
        WHERE lower(email) = ${email}
        LIMIT 1
        FOR UPDATE
      `;

      if (!user) throw new Error(`No account found for ${email}. Sign in with Google once before granting access.`);
      if (action === "grant" && !isDirectGoogleAccount(user)) {
        throw new Error("Admin access can only be granted to an account created directly through verified Google sign-in.");
      }

      const nextRole = action === "grant" ? "admin" : "user";
      if (user.role === nextRole) return { email, role: user.role, changed: false };

      await tx`UPDATE users SET role = ${nextRole}, "updatedAt" = now() WHERE id = ${user.id}`;
      await tx`DELETE FROM "authSessions" WHERE "userId" = ${user.id}`;
      await tx`
        INSERT INTO "auditLogs" (action, "entityType", "entityId", details)
        VALUES (${"ADMIN_ROLE_" + (action === "grant" ? "GRANTED" : "REVOKED")}, 'user', ${user.id}, ${JSON.stringify({ source: "operator_cli", role: nextRole, sessionsRevoked: true })})
      `;
      return { email, role: nextRole, changed: true, sessionsRevoked: true };
    });

    console.log(result.changed
      ? `Updated ${result.email} to role "${result.role}" and revoked all existing sessions. Sign in again to continue.`
      : `${result.email} already has role "${result.role}".`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(`[Admin access] ${error instanceof Error ? error.message : "Operation failed."}`);
  process.exitCode = 1;
});
