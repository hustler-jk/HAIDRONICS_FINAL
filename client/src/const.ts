export { COOKIE_NAME } from "@shared/const";

// Start the same Google OAuth flow for both sign-in and account creation.
// New Google accounts are created by the server after Google verifies email.
export const startLogin = () => {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/api/oauth/google?returnTo=${encodeURIComponent(returnTo)}`);
};
