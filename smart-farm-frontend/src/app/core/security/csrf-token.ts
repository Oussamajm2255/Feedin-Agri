/**
 * In-memory copy of the CSRF token.
 *
 * The backend sets the `sf_csrf` cookie on its own domain. When the app is
 * served from a different domain (feedingreen.com -> *.up.railway.app), that
 * cookie is not visible to `document.cookie`, so the double-submit header
 * could never be sent and every POST/PATCH/DELETE got 403 "Invalid CSRF
 * token". GET /auth/csrf also returns the token in its body; we keep it here.
 */
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null | undefined): void {
  // Browser only: during SSR this module is shared across all requests.
  if (typeof window === 'undefined') return;
  if (typeof token === 'string' && token.length > 0) {
    csrfToken = token;
  }
}

export function getCsrfToken(): string | null {
  return csrfToken;
}
