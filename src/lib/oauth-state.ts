import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

type OAuthProvider = "google" | "outlook";

type OAuthStatePayload = {
  userId: string;
  provider: OAuthProvider;
  expiresAt: number;
  nonce: string;
};

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required for OAuth state");
  return secret;
}

function sign(encodedPayload: string) {
  return createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createOAuthState(userId: string, provider: OAuthProvider) {
  const payload: OAuthStatePayload = {
    userId,
    provider,
    expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
    nonce: randomBytes(16).toString("base64url"),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyOAuthState(
  state: unknown,
  userId: string,
  provider: OAuthProvider
) {
  if (typeof state !== "string") return false;
  const [encodedPayload, signature, extra] = state.split(".");
  if (!encodedPayload || !signature || extra) return false;

  const expected = Buffer.from(sign(encodedPayload));
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<OAuthStatePayload>;
    return (
      payload.userId === userId &&
      payload.provider === provider &&
      typeof payload.expiresAt === "number" &&
      payload.expiresAt >= Date.now() &&
      typeof payload.nonce === "string" &&
      payload.nonce.length > 0
    );
  } catch {
    return false;
  }
}
