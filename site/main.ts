const PRODUCT = 'tab-context-capsule';
const BASE = 'https://api.sociobot.in/api/v1';
const key = `sb_license:${PRODUCT}`;
const verdictKey = `sb_license_verdict:${PRODUCT}`;

const query = new URLSearchParams(location.search);
const returnedLicense = query.get('license');
if (returnedLicense) {
  localStorage.setItem(key, returnedLicense);
  const url = new URL(location.href); url.searchParams.delete('license'); history.replaceState({}, '', url);
  void verify(returnedLicense, true);
}

const toggle = document.querySelector<HTMLButtonElement>('#restore-toggle');
const panel = document.querySelector<HTMLFormElement>('#restore-panel');
toggle?.addEventListener('click', () => {
  const open = panel?.hidden ?? true;
  if (panel) panel.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open) panel?.querySelector<HTMLInputElement>('input')?.focus();
});
panel?.addEventListener('submit', (event) => {
  event.preventDefault(); const token = new FormData(panel).get('license');
  if (typeof token === 'string' && token.trim()) { localStorage.setItem(key, token.trim()); void verify(token.trim(), true); }
});

async function verify(token: string, showToken: boolean): Promise<void> {
  const result = document.querySelector<HTMLElement>('#license-result');
  if (result) result.textContent = 'Checking your ticket…';
  try {
    const response = await fetch(`${BASE}/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error();
    const data = await response.json() as { valid: boolean; reason: string };
    localStorage.setItem(verdictKey, JSON.stringify({ valid: data.valid, reason: data.reason, checkedAt: Date.now() }));
    if (result) {
      result.replaceChildren(document.createTextNode(data.valid ? 'License verified. Copy this token, open the extension’s Conductor tab, and paste it under “Have a license?” ' : 'This license is not active. Check the token and try again.'));
      if (data.valid && showToken) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'text-button'; button.textContent = 'Copy license token';
        button.addEventListener('click', async () => { await navigator.clipboard.writeText(token); button.textContent = 'Copied'; }); result.append(button);
      }
    }
  } catch { if (result) result.textContent = 'License verification is offline. Your free extension still works; try again later.'; }
}
