import type { NextRequest } from "next/server";

function configuredPublicOrigin(): string | null {
  const configured = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
  if (!configured) return null;

  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

/**
 * Rebuild a user-facing URL on the configured public origin. Railway and
 * similar reverse proxies may expose an internal host through request.url;
 * that host must never be serialized into sign-in callbacks.
 */
export function publicRequestUrl(
  request: NextRequest,
  pathname = request.nextUrl.pathname,
  search = request.nextUrl.search
): URL {
  const origin = configuredPublicOrigin() || request.nextUrl.origin;
  return new URL(`${pathname}${search}`, origin);
}
