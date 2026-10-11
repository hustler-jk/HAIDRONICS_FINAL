# Admin access

Admin uses the normal account page and Google sign-in; there is no public admin
registration form. Customer sign-up never assigns the admin role, and every
admin API procedure checks the role stored on the server.

## First admin

1. Configure Google OAuth and `DATABASE_URL` for the deployment. Keep OAuth
   secrets and database credentials on the server; never put them in `VITE_`
   variables.
2. Sign in once with the intended admin's Google account. This creates an
   account with a Google-verified email and does not grant admin access yet.
3. From a trusted machine with the server's private `.env` configured, run:

   ```powershell
   npm run admin:grant -- admin@example.com
   ```

   The command only grants access to a direct Google account. It updates the
   account role, revokes all existing sessions for that account, and writes an
   admin-role change to the audit log. It does not accept passwords or expose
   a role-grant endpoint to the website.
4. Sign in again at `/account?next=%2Fadmin` using that same Google account.
   Role changes intentionally sign the account out everywhere.

To revoke admin access, run:

```

npm run admin:revoke -- admin@example.com
```

Revocation also invalidates all active sessions for that account.

Do not run these commands in a public browser or expose the database connection
string. For stronger account protection, enable Google's 2-Step Verification
for every admin account. The application does not currently enforce a separate
MFA challenge.
