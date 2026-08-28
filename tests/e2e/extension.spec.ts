import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { chromium, expect, test } from '@playwright/test';

test('390px popup keeps every tab-order control at least 44 by 44 CSS pixels', async ({ baseURL }) => {
  const profile = mkdtempSync(resolve(tmpdir(), 'tab-context-capsule-'));
  const extension = resolve(import.meta.dirname, '../../dist/extension');
  const context = await chromium.launchPersistentContext(profile, {
    headless: true,
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
    await popup.setViewportSize({ width: 390, height: 844 });
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);

    const controls = popup.locator('.icon-button');
    await expect(controls).not.toHaveCount(0);
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
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
});
