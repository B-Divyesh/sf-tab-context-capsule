import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { chromium, expect, test } from '@playwright/test';
import axe from 'axe-core';

test('390px popup keeps every tab-order control at least 44 by 44 CSS pixels', async ({ baseURL }) => {
  const profile = mkdtempSync(resolve(tmpdir(), 'tab-context-capsule-'));
  const extension = resolve(import.meta.dirname, '../../dist/extension');
  // Chromium only starts an unpacked MV3 worker in a headed session. xvfb-run
  // in test:e2e supplies that display without requiring a real desktop.
  const context = await chromium.launchPersistentContext(profile, {
    headless: false,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
  });

  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;

    const firstTab = await context.newPage();
    await firstTab.goto(baseURL!);
    const secondTab = await context.newPage();
    await secondTab.goto(`${baseURL}/privacy/`);
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 1280, height: 720 });
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);

    const errors: string[] = [];
    popup.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const controls = popup.locator('.icon-button');
    await expect(controls).not.toHaveCount(0);
    expect(await popup.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
    await popup.setViewportSize({ width: 390, height: 844 });
    // Execute through the browser-debugging protocol. Injecting an inline
    // script would weaken the production MV3 CSP and is correctly blocked.
    await popup.evaluate(axe.source);
    const accessibility = await popup.evaluate(async () => {
      const runtime = (window as unknown as { axe: { run: () => Promise<{ violations: Array<{ impact: string | null }> }> } }).axe;
      return runtime.run();
    });
    expect(accessibility.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    const dimensions = await controls.evaluateAll((buttons) => buttons.map((button) => {
      const { width, height } = button.getBoundingClientRect();
      return { width, height };
    }));
    expect(dimensions).toEqual(expect.arrayContaining([
      expect.objectContaining({ width: expect.any(Number), height: expect.any(Number) })
    ]));
    dimensions.forEach(({ width, height }) => {
      expect(width).toBeGreaterThanOrEqual(44);
      expect(height).toBeGreaterThanOrEqual(44);
    });
    expect(await popup.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    const moveDown = popup.locator('button[aria-label$="down"]:not([disabled])').first();
    const tabId = await moveDown.getAttribute('data-tab-id');
    expect(tabId).not.toBeNull();
    await moveDown.focus();
    await popup.keyboard.press('Enter');
    await expect(popup.locator(`button[data-tab-id="${tabId}"]:not([disabled])`)).toBeFocused();
    await popup.locator('#capsule-name').fill('QA repair capsule');
    await popup.locator('#next-step').fill('Reopen this evidence later.');
    await popup.getByRole('button', { name: 'Seal capsule' }).click();
    await expect(popup.getByRole('heading', { name: 'Capsule library' })).toBeVisible();
    const stored = await popup.evaluate(async () => (await chrome.storage.local.get('capsules:v1'))['capsules:v1']);
    expect(stored).toEqual([expect.objectContaining({
      name: 'QA repair capsule',
      nextStep: 'Reopen this evidence later.',
      tabs: expect.arrayContaining([expect.objectContaining({ url: `${baseURL}/` })])
    })]);
    const downloadPromise = popup.waitForEvent('download');
    await popup.getByRole('button', { name: 'Export Markdown' }).click();
    expect((await downloadPromise).suggestedFilename()).toBe('qa-repair-capsule.md');
    popup.once('dialog', (dialog) => void dialog.accept());
    await popup.getByRole('button', { name: 'Delete QA repair capsule' }).click();
    await popup.getByRole('button', { name: 'Undo' }).click();
    await expect(popup.getByRole('heading', { name: 'QA repair capsule' })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
});
