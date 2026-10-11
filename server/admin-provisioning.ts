export function isDirectGoogleAccount(user: {
  openId: string;
  loginMethod: string | null;
}): boolean {
  return user.openId.startsWith("google:") && user.loginMethod === "google";
}
