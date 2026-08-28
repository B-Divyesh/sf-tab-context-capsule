import axe from 'axe-core';
import { expect, test } from '@playwright/test';

test('landing page has a clear install path and no serious accessibility issues', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Tab Context Capsule/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Download the extension' })).toHaveAttribute('download', '');
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => {
    const runtime = (window as unknown as { axe: { run: () => Promise<{ violations: Array<{ impact: string | null }> }> } }).axe;
    return runtime.run();
  });
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  expect(errors).toEqual([]);
});

test('mobile layout keeps the full proposition and legal routes usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Stop now/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /night train/i })).toBeVisible();
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Privacy/);
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Simple terms/);
});
