import { OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { randomBytes, createHash } from "node:crypto";
import axios from "axios";
import { createRemoteJWKSet, jwtVerify } from "jose";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { issueSessionCookies } from "../auth/session";
import { sdk } from "./sdk";
import { ENV } from "./env";

const GOOGLE_STATE_COOKIE = "haidronics_google_state";
const GOOGLE_NONCE_COOKIE = "haidronics_google_nonce";
const GOOGLE_VERIFIER_COOKIE = "haidronics_google_verifier";
const GOOGLE_RETURN_COOKIE = "haidronics_google_return_to";
const GOOGLE_FLOW_MAX_AGE = 10 * 60 * 1000;
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function isSafeReturnPath(path: string | undefined): path is string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\") || /[\u0000-\u001f]/.test(path)) {
    return false;
  }
  try {
    const parsed = new URL(path, "https://haidronics.invalid");
    return parsed.origin === "https://haidronics.invalid" && !parsed.pathname.startsWith("/api/oauth/");
  } catch {
    return false;
  }
}

function googleCookieOptions(req: Request) {
  return {
    ...getSessionCookieOptions(req),
    maxAge: GOOGLE_FLOW_MAX_AGE,
  };
}

function clearGoogleFlowCookies(res: Response, req: Request) {
  const options = getSessionCookieOptions(req);
  for (const name of [GOOGLE_STATE_COOKIE, GOOGLE_NONCE_COOKIE, GOOGLE_VERIFIER_COOKIE, GOOGLE_RETURN_COOKIE]) {
    res.clearCookie(name, options);
  }
}

function googleOAuthConfigured() {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret && ENV.googleRedirectUri);
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/google", (req: Request, res: Response) => {
    if (!googleOAuthConfigured()) {
      res.status(503).send("Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.");
      return;
    }

    const returnTo = getQueryParam(req, "returnTo");
    const state = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const verifier = randomBytes(48).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const cookieOptions = googleCookieOptions(req);

    res.cookie(GOOGLE_STATE_COOKIE, state, { ...cookieOptions, httpOnly: true });
    res.cookie(GOOGLE_NONCE_COOKIE, nonce, { ...cookieOptions, httpOnly: true });
    res.cookie(GOOGLE_VERIFIER_COOKIE, verifier, { ...cookieOptions, httpOnly: true });
    if (isSafeReturnPath(returnTo)) {
      res.cookie(GOOGLE_RETURN_COOKIE, returnTo, { ...cookieOptions, httpOnly: true });
    } else {
      res.clearCookie(GOOGLE_RETURN_COOKIE, getSessionCookieOptions(req));
    }

    const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizationUrl.searchParams.set("client_id", ENV.googleClientId);
    authorizationUrl.searchParams.set("redirect_uri", ENV.googleRedirectUri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "openid email profile");
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("nonce", nonce);
    authorizationUrl.searchParams.set("code_challenge", challenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
    res.redirect(302, authorizationUrl.toString());
  });

  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const state = getQueryParam(req, "state");
    const code = getQueryParam(req, "code");
    const returnTo = cookies[GOOGLE_RETURN_COOKIE];
    clearGoogleFlowCookies(res, req);

    if (getQueryParam(req, "error")) {
      res.redirect(302, "/account?error=google_oauth");
      return;
    }
    if (!googleOAuthConfigured()) {
      res.status(503).send("Google sign-in is not configured.");
      return;
    }
    if (!code || !state || !cookies[GOOGLE_STATE_COOKIE] || state !== cookies[GOOGLE_STATE_COOKIE] || !cookies[GOOGLE_NONCE_COOKIE] || !cookies[GOOGLE_VERIFIER_COOKIE]) {
      res.status(400).send("Google sign-in could not be verified. Please try again.");
      return;
    }

    try {
      const tokenResponse = await axios.post<{
        id_token?: string;
      }>("https://oauth2.googleapis.com/token", new URLSearchParams({
        code,
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        redirect_uri: ENV.googleRedirectUri,
        grant_type: "authorization_code",
        code_verifier: cookies[GOOGLE_VERIFIER_COOKIE],
      }), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15_000,
      });
      const idToken = tokenResponse.data.id_token;
      if (!idToken) throw new Error("Google token response did not contain an ID token");

      const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: ENV.googleClientId,
      });
      const subject = typeof payload.sub === "string" ? payload.sub : "";
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
      const emailVerified = payload.email_verified === true;
      const name = typeof payload.name === "string" ? payload.name : "";
      if (!subject || !email || !emailVerified || payload.nonce !== cookies[GOOGLE_NONCE_COOKIE]) {
        throw new Error("Google identity token is missing a verified email or valid nonce");
      }

      if (!(await db.getDb())) {
        res.status(503).send("Account services are unavailable. Please try again later.");
        return;
      }

      const existingUser = await db.getUserByEmail(email);
      const openId = existingUser?.openId || `google:${subject}`;
      await db.upsertUser({
        openId,
        name: existingUser?.name || name || email,
        email,
        loginMethod: "google",
        emailVerifiedAt: new Date(),
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) throw new Error("Google account could not be loaded after sign-in");
      await issueSessionCookies(req, res, user);
      res.redirect(302, isSafeReturnPath(returnTo) ? returnTo : "/account");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.redirect(302, "/account?error=google_oauth");
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(userInfo.openId);
      if (!user) throw new Error("OAuth account could not be loaded after sign-in");
      await issueSessionCookies(req, res, user);

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
