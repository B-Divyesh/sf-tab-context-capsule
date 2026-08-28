import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

describe('release safety configuration', () => {
  it('keeps tab-order buttons at the required 44px touch target', () => {
    const css = readFileSync(resolve(root, 'src/entrypoints/popup/style.css'), 'utf8');
    expect(css).toMatch(/\.icon-button\s*\{[^}]*width:\s*44px;[^}]*min-height:\s*44px;/s);
  });

  it('ships immutable release assets and hardened static-site headers', () => {
    const config = JSON.parse(readFileSync(resolve(root, 'site/public/staticwebapp.config.json'), 'utf8')) as {
      globalHeaders: Record<string, string>;
      routes: Array<{ route: string; headers: Record<string, string> }>;
    };
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(config.routes).toEqual(expect.arrayContaining([
      expect.objectContaining({ route: '/assets/*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }),
      expect.objectContaining({ route: '/downloads/tab-context-capsule-1.0.0.zip', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } })
    ]));
  });
});
