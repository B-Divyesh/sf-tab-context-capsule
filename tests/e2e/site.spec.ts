import axe from 'axe-core';
import { expect, test } from '@playwright/test';

test('first screen names the job, audience, and sample action on desktop and phone', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page).toHaveTitle('Tab Context Capsule — Save selected tabs with context');
    await expect(page.getByRole('heading', { level: 1, name: 'Save selected tabs with their purpose' })).toBeVisible();
    await expect(page.getByText(/For researchers and knowledge workers/)).toBeVisible();
    const sampleAction = page.getByRole('link', { name: 'Try it with sample data' });
    await expect(sampleAction).toBeVisible();
    await expect(sampleAction).toHaveAttribute('href', '/demo/');
    const bounds = await sampleAction.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  }
  expect(errors).toEqual([]);
});

test('public routes have one h1, complete metadata, a standard header, and no serious accessibility issues', async ({ page }) => {
  for (const route of ['/', '/demo/', '/privacy/', '/terms/']) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/tab-context-capsule\.sociobot\.in\//);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-card\.png$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/assets/apple-touch-icon.png');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link', { name: 'Demo' })).toHaveAttribute('href', '/demo/');
    await expect(nav.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy/');
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => {
      const runtime = (window as unknown as { axe: { run: () => Promise<{ violations: Array<{ impact: string | null }> }> } }).axe;
      return runtime.run();
    });
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  }
});

test('demo opens populated, labels the sandbox, resets, and keeps controls usable at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/');
  await expect(page).toHaveTitle('Demo — Tab Context Capsule');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('[data-capsule-id="demo-coastal-erosion"]')).toContainText('Coastal erosion sources');
  await page.locator('#demo-name').fill('Temporary sample');
  await page.getByRole('button', { name: 'Save sample capsule' }).click();
  await expect(page.locator('[data-capsule-id]').filter({ hasText: 'Temporary sample' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('[data-capsule-id]')).toHaveCount(1);
  await expect(page.locator('[data-capsule-id="demo-coastal-erosion"]')).toBeVisible();
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeInViewport();
  expect(await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }))).toEqual({ viewport: 390, content: 390 });
  const targets = await page.locator('button, a.button, input:not([type="checkbox"])').evaluateAll((nodes) => nodes.filter((node) => {
    const style = getComputedStyle(node);
    return style.visibility !== 'hidden' && style.display !== 'none';
  }).map((node) => {
    const box = node.getBoundingClientRect();
    return { label: node.getAttribute('aria-label') || node.textContent || '', width: box.width, height: box.height };
  }));
  expect(targets.filter((target) => target.width > 1 && target.height > 1).every((target) => target.height >= 44)).toBe(true);
});

test('unknown routes return the designed page with HTTP 404', async ({ page }) => {
  const response = await page.goto('/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Tab Context Capsule');
  await expect(page.getByRole('heading', { level: 1, name: 'This page does not exist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: 'Try the sample demo' })).toHaveAttribute('href', '/demo/');
});

test('skip links move keyboard focus to main on every public page', async ({ page }) => {
  for (const route of ['/', '/demo/', '/privacy/', '/terms/', '/does-not-exist']) {
    await page.goto(route);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  }
});

test('legal pages fit a phone viewport and reduced motion disables smooth scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/privacy/', '/terms/']) {
    await page.goto(route);
    expect(await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }))).toEqual({ viewport: 390, content: 390 });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.locator('html').evaluate((node) => getComputedStyle(node).scrollBehavior)).toBe('auto');
});
