import { readFile } from 'node:fs/promises';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

interface ExtensionSandbox {
  context: BrowserContext;
  popup: Page;
  profile: string;
}

async function openExtensionSandbox(baseURL: string): Promise<ExtensionSandbox> {
  const profile = mkdtempSync(resolve(tmpdir(), 'tab-context-claim-'));
  const extension = resolve(import.meta.dirname, '../../dist/extension');
  const context = await chromium.launchPersistentContext(profile, {
    headless: false,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
  });
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  const first = await context.newPage();
  await first.goto(`${baseURL}/demo/`);
  const second = await context.newPage();
  await second.goto(`${baseURL}/privacy/`);
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${new URL(worker.url()).host}/popup.html`);
  await expect(popup.getByRole('heading', { name: 'Capture current tabs' })).toBeVisible();
  return { context, popup, profile };
}

async function closeSandbox(sandbox: ExtensionSandbox): Promise<void> {
  await sandbox.context.close();
  rmSync(sandbox.profile, { recursive: true, force: true });
}

async function saveCapsule(popup: Page, name: string): Promise<void> {
  await popup.locator('#capsule-name').fill(name);
  await popup.locator('#next-step').fill('Compare the evidence and write the findings.');
  await popup.locator('.tab-note').first().fill('Primary source for the opening section.');
  const moveDown = popup.locator('button[aria-label$="down"]:not([disabled])').first();
  if (await moveDown.count()) await moveDown.click();
  await popup.getByRole('button', { name: 'Save capsule' }).click();
  await expect(popup.getByRole('heading', { name })).toBeVisible();
}

test('@claim:capture-context saves selected tabs with their notes, order, and next step', async ({ baseURL }) => {
  const sandbox = await openExtensionSandbox(baseURL!);
  try {
    await saveCapsule(sandbox.popup, 'Claim research handoff');
    const stored = await sandbox.popup.evaluate(async () => (await chrome.storage.local.get('capsules:v1'))['capsules:v1']);
    expect(stored).toEqual([expect.objectContaining({
      name: 'Claim research handoff',
      nextStep: 'Compare the evidence and write the findings.',
      tabs: expect.arrayContaining([expect.objectContaining({ note: 'Primary source for the opening section.' })])
    })]);
    expect(stored[0].tabs.map((tab: { url: string }) => tab.url)).toHaveLength(2);
  } finally { await closeSandbox(sandbox); }
});

test('@claim:close-by-choice closes originals only after the user chooses and confirms', async ({ baseURL }) => {
  const sandbox = await openExtensionSandbox(baseURL!);
  try {
    const openProductTabs = () => sandbox.context.pages().filter((page) => page.url().startsWith(baseURL!));
    expect(openProductTabs()).toHaveLength(2);
    await saveCapsule(sandbox.popup, 'Keep originals open');
    expect(openProductTabs()).toHaveLength(2);
    await sandbox.popup.reload();
    await expect(sandbox.popup.getByRole('heading', { name: 'Capture current tabs' })).toBeVisible();
    await sandbox.popup.locator('#capsule-name').fill('Close after confirmation');
    await sandbox.popup.locator('#close-originals').check();
    sandbox.popup.once('dialog', (dialog) => void dialog.accept());
    await sandbox.popup.getByRole('button', { name: 'Save capsule' }).click();
    await expect.poll(() => openProductTabs().length).toBe(0);
  } finally { await closeSandbox(sandbox); }
});

test('@claim:markdown-export downloads readable Markdown with the saved next step and ordered links', async ({ baseURL }) => {
  const sandbox = await openExtensionSandbox(baseURL!);
  try {
    await saveCapsule(sandbox.popup, 'Readable research handoff');
    const pending = sandbox.popup.waitForEvent('download');
    await sandbox.popup.getByRole('button', { name: 'Export Markdown' }).click();
    const download = await pending;
    const body = await readFile((await download.path())!, 'utf8');
    expect(body).toContain('# Readable research handoff');
    expect(body).toContain('**Next step:** Compare the evidence and write the findings.');
    expect(body).toMatch(/1\. \[.+\]\(http:\/\/127\.0\.0\.1:4173\/.+\)/);
    expect(body).toContain('Primary source for the opening section.');
  } finally { await closeSandbox(sandbox); }
});

test('@claim:json-roundtrip restores the same capsule from its JSON export', async ({ baseURL }) => {
  const sandbox = await openExtensionSandbox(baseURL!);
  try {
    await saveCapsule(sandbox.popup, 'Lossless JSON handoff');
    const before = await sandbox.popup.evaluate(async () => (await chrome.storage.local.get('capsules:v1'))['capsules:v1'][0]);
    const pending = sandbox.popup.waitForEvent('download');
    await sandbox.popup.getByRole('button', { name: 'Export JSON' }).click();
    const exported = await readFile((await (await pending).path())!);
    sandbox.popup.once('dialog', (dialog) => void dialog.accept());
    await sandbox.popup.getByRole('button', { name: 'Delete Lossless JSON handoff' }).click();
    await sandbox.popup.locator('input[type="file"]').setInputFiles({ name: 'capsule.json', mimeType: 'application/json', buffer: exported });
    await expect(sandbox.popup.getByText('Imported 1 capsule.')).toBeVisible();
    const after = await sandbox.popup.evaluate(async () => (await chrome.storage.local.get('capsules:v1'))['capsules:v1'][0]);
    expect(after).toEqual(before);
  } finally { await closeSandbox(sandbox); }
});

test('@claim:local-storage keeps demo changes isolated and leaves an existing real-data key unchanged', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('capsules:v1', 'real-data-sentinel'));
  await page.goto('/demo/');
  await page.locator('#demo-name').fill('Isolated demo save');
  await page.getByRole('button', { name: 'Save sample capsule' }).click();
  await expect(page.locator('[data-capsule-id]').filter({ hasText: 'Isolated demo save' })).toBeVisible();
  const storage = await page.evaluate(() => ({
    real: localStorage.getItem('capsules:v1'),
    demo: localStorage.getItem('demo:tab-context-capsule:capsules:v1'),
    keys: Object.keys(localStorage)
  }));
  expect(storage.real).toBe('real-data-sentinel');
  expect(storage.demo).toContain('Isolated demo save');
  expect(storage.keys.filter((key) => key.startsWith('demo:'))).toEqual(['demo:tab-context-capsule:capsules:v1']);
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await pending;
  expect(await page.evaluate(() => localStorage.getItem('demo:tab-context-capsule:capsules:v1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('capsules:v1'))).toBe('real-data-sentinel');
});

test('@claim:no-url-transmission completes a capture without sending capsule data to another origin', async ({ baseURL }) => {
  const sandbox = await openExtensionSandbox(baseURL!);
  const requests: string[] = [];
  sandbox.context.on('request', (request) => requests.push(request.url()));
  try {
    await saveCapsule(sandbox.popup, 'Private request audit');
    const forbidden = requests.filter((url) => url.startsWith('http') && new URL(url).origin !== new URL(baseURL!).origin);
    expect(forbidden).toEqual([]);
    expect(requests.join('\n')).not.toContain('Private%20request%20audit');
    expect(requests.join('\n')).not.toContain('Primary%20source');
  } finally { await closeSandbox(sandbox); }
});

test('@claim:no-account-analytics opens the extension without sign-in and makes no analytics request', async ({ baseURL }) => {
  const sandbox = await openExtensionSandbox(baseURL!);
  const requests: string[] = [];
  sandbox.context.on('request', (request) => requests.push(request.url()));
  try {
    await expect(sandbox.popup.getByRole('heading', { name: 'Capture current tabs' })).toBeVisible();
    await expect(sandbox.popup.getByRole('textbox', { name: 'Capsule name' })).toBeEnabled();
    await expect(sandbox.popup.getByRole('link', { name: /sign in|log in|account/i })).toHaveCount(0);
    const manifest = await sandbox.popup.evaluate(() => chrome.runtime.getManifest());
    expect(manifest.permissions).toEqual(['tabs', 'storage']);
    expect(manifest.host_permissions ?? []).toEqual([]);
    expect(manifest.content_scripts ?? []).toEqual([]);
    await saveCapsule(sandbox.popup, 'No account needed');
    expect(requests.filter((url) => /analytics|telemetry|segment|google-analytics/i.test(url))).toEqual([]);
  } finally { await closeSandbox(sandbox); }
});

test('@claim:private-opt-in excludes the private sample by default and resets the choice after capture', async ({ page }) => {
  await page.goto('/demo/');
  const privateTab = page.getByRole('checkbox', { name: 'Include Interview notes — planning team' });
  await expect(privateTab).toBeDisabled();
  await expect(privateTab).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Include the private sample tab this time' }).check();
  await expect(privateTab).toBeEnabled();
  await expect(privateTab).toBeChecked();
  await page.locator('#demo-name').fill('Includes private sample once');
  await page.getByRole('button', { name: 'Save sample capsule' }).click();
  await expect(page.locator('[data-capsule-id]').filter({ hasText: 'Includes private sample once' })).toContainText('4 tabs');
  await expect(page.getByRole('checkbox', { name: 'Include the private sample tab this time' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Include Interview notes — planning team' })).toBeDisabled();
});

test('@claim:free-core completes capture, reopen, Markdown and JSON export, and JSON import without a license', async ({ baseURL }) => {
  const sandbox = await openExtensionSandbox(baseURL!);
  try {
    expect(await sandbox.popup.evaluate(() => localStorage.getItem('sb_license:tab-context-capsule'))).toBeNull();
    await saveCapsule(sandbox.popup, 'Free workflow');
    await expect(sandbox.popup.getByRole('button', { name: 'Open 2 tabs' })).toBeEnabled();
    await sandbox.popup.getByRole('button', { name: 'Open 2 tabs' }).click();
    await expect(sandbox.popup.getByText(/Opened 2 tabs/)).toBeVisible();
    for (const label of ['Export Markdown', 'Export JSON']) {
      const pending = sandbox.popup.waitForEvent('download');
      await sandbox.popup.getByRole('button', { name: label }).click();
      expect(await (await pending).path()).toBeTruthy();
    }
    const bundle = await sandbox.popup.evaluate(async () => {
      const capsule = (await chrome.storage.local.get('capsules:v1'))['capsules:v1'][0];
      return JSON.stringify({ product: 'tab-context-capsule', version: 1, exportedAt: new Date().toISOString(), capsules: [capsule] });
    });
    await sandbox.popup.locator('input[type="file"]').setInputFiles({ name: 'free.json', mimeType: 'application/json', buffer: Buffer.from(bundle) });
    await expect(sandbox.popup.getByText('Imported 1 capsule.')).toBeVisible();
  } finally { await closeSandbox(sandbox); }
});

test('@claim:conductor-offer shows the exact one-time price and the two paid conveniences', async ({ page }) => {
  await page.goto('/demo/');
  await page.goto('/#pricing');
  const pricing = page.locator('#pricing');
  await expect(pricing).toContainText('$12 USD · one-time purchase');
  await expect(pricing).toContainText('Copy Markdown in one click');
  await expect(pricing).toContainText('Use brass and jade capsule colors');
  await expect(pricing.getByRole('link', { name: 'Buy Conductor — $12' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/tab-context-capsule/checkout');
});

test('@claim:license-check sends only the token and does not repeat an automatic check within one day', async ({ baseURL }) => {
  const sandbox = await openExtensionSandbox(baseURL!);
  const verificationUrls: string[] = [];
  await sandbox.context.route('https://api.sociobot.in/api/v1/products/tab-context-capsule/verify?**', async (route) => {
    verificationUrls.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) });
  });
  try {
    await sandbox.popup.evaluate(() => {
      localStorage.setItem('sb_license:tab-context-capsule', 'claim-token-123');
      localStorage.removeItem('sb_license_verdict:tab-context-capsule');
    });
    await sandbox.popup.reload();
    await expect.poll(() => verificationUrls.length).toBe(1);
    await sandbox.popup.reload();
    await sandbox.popup.waitForTimeout(300);
    expect(verificationUrls).toHaveLength(1);
    const verification = new URL(verificationUrls[0]);
    expect([...verification.searchParams.keys()]).toEqual(['license']);
    expect(verification.searchParams.get('license')).toBe('claim-token-123');
  } finally { await closeSandbox(sandbox); }
});
