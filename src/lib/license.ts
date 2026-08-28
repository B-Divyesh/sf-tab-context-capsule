export const PRODUCT_SLUG = 'tab-context-capsule';
export const BILLING_BASE = 'https://api.sociobot.in/api/v1';
export const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`;
export const VERDICT_KEY = `sb_license_verdict:${PRODUCT_SLUG}`;
export const CHECKOUT_URL = `${BILLING_BASE}/products/${PRODUCT_SLUG}/checkout`;
export const DAY_MS = 86_400_000;

export interface LicenseVerdict {
  valid: boolean;
  reason: string;
  checkedAt: number;
}

export function verifyUrl(token: string): string {
  return `${BILLING_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`;
}

export function hasFreshValidVerdict(raw: string | null, now = Date.now()): boolean {
  if (!raw) return false;
  try {
    const value = JSON.parse(raw) as LicenseVerdict;
    return value.valid === true && now - value.checkedAt < DAY_MS;
  } catch {
    return false;
  }
}
