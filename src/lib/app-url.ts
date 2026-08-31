/**
 * Build a public application URL without depending on whether NEXTAUTH_URL
 * was configured with a trailing slash.
 */
export function getAppUrl(path: string): string {
  const configuredUrl = process.env.NEXTAUTH_URL;

  if (!configuredUrl) {
    throw new Error("NEXTAUTH_URL is not configured");
  }

  const baseUrl = `${configuredUrl.replace(/\/+$/, "")}/`;
  return new URL(path.replace(/^\/+/, ""), baseUrl).toString();
}
