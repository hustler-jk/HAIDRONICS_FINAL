import {
  ACCESS_TOKEN_TTL_MS,
  ADMIN_SESSION_IDLE_TTL_MS,
  ADMIN_SESSION_MAX_TTL_MS,
  CUSTOMER_SESSION_IDLE_TTL_MS,
  CUSTOMER_SESSION_MAX_TTL_MS,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_GRACE_MS,
  COOKIE_NAME,
} from "@shared/const";
import { createHash, randomBytes } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema";
import { createAuthSession, getAuthSessionForRefresh, revokeAuthSession, rotateAuthSession } from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";

const refreshTokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export function getSessionLifetimes(user: Pick<User, "role">) {
  return user.role === "admin"
    ? { idle: ADMIN_SESSION_IDLE_TTL_MS, absolute: ADMIN_SESSION_MAX_TTL_MS }
    : { idle: CUSTOMER_SESSION_IDLE_TTL_MS, absolute: CUSTOMER_SESSION_MAX_TTL_MS };
}

function setAccessCookie(req: Request, res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    maxAge: ACCESS_TOKEN_TTL_MS,
  });
}

function setRefreshCookie(req: Request, res: Response, token: string, maxAge: number) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    path: "/api",
    maxAge,
  });
}

export async function issueSessionCookies(req: Request, res: Response, user: User) {
  const now = new Date();
  const token = randomBytes(32).toString("base64url");
  const lifetimes = getSessionLifetimes(user);
  const absoluteExpiresAt = new Date(now.getTime() + lifetimes.absolute);
  const idleExpiresAt = new Date(Math.min(now.getTime() + lifetimes.idle, absoluteExpiresAt.getTime()));
  const sessionId = await createAuthSession({
    userId: user.id,
    tokenHash: refreshTokenHash(token),
    idleExpiresAt,
    absoluteExpiresAt,
    now,
  });

  const accessToken = await sdk.createSessionToken(user.openId, {
    name: user.name || "User",
    expiresInMs: ACCESS_TOKEN_TTL_MS,
    sessionId,
  });
  setAccessCookie(req, res, accessToken);
  setRefreshCookie(req, res, token, idleExpiresAt.getTime() - now.getTime());
}

export async function refreshSessionCookies(req: Request, res: Response): Promise<User | null> {
  const rawRefreshToken = parseCookieHeader(req.headers.cookie ?? "")[REFRESH_COOKIE_NAME];
  if (!rawRefreshToken) return null;

  const now = new Date();
  const currentTokenHash = refreshTokenHash(rawRefreshToken);
  const currentSession = await getAuthSessionForRefresh(currentTokenHash, now);
  if (!currentSession) return null;
  const lifetimes = getSessionLifetimes(currentSession.user);
  const nextToken = randomBytes(32).toString("base64url");
  const idleExpiresAt = new Date(Math.min(
    now.getTime() + lifetimes.idle,
    currentSession.absoluteExpiresAt.getTime(),
  ));
  const result = await rotateAuthSession({
    currentTokenHash,
    nextTokenHash: refreshTokenHash(nextToken),
    now,
    graceUntil: new Date(now.getTime() + REFRESH_TOKEN_GRACE_MS),
    idleExpiresAt,
  });
  if (!result) return null;

  const accessToken = await sdk.createSessionToken(result.user.openId, {
    name: result.user.name || "User",
    expiresInMs: ACCESS_TOKEN_TTL_MS,
    sessionId: result.sessionId,
  });
  setAccessCookie(req, res, accessToken);

  if (result.status === "rotated") {
    setRefreshCookie(req, res, nextToken, idleExpiresAt.getTime() - now.getTime());
  }

  return result.user;
}

export async function clearSessionCookies(req: Request, res: Response) {
  const rawRefreshToken = parseCookieHeader(req.headers.cookie ?? "")[REFRESH_COOKIE_NAME];
  if (rawRefreshToken) {
    await revokeAuthSession(refreshTokenHash(rawRefreshToken));
  }
  res.clearCookie(COOKIE_NAME, getSessionCookieOptions(req));
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getSessionCookieOptions(req),
    path: "/api",
  });
}
