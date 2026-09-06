import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');

describe('release safety configuration', () => {
  it('ships immutable assets, hardened headers, and a real 404 response', () => {
    const config = JSON.parse(readFileSync(resolve(root, 'site/public/staticwebapp.config.json'), 'utf8')) as {
      globalHeaders: Record<string, string>;
      routes: Array<{ route: string; headers: Record<string, string> }>;
      navigationFallback?: unknown;
      responseOverrides: Record<string, { rewrite: string }>;
    };
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(config.navigationFallback).toBeUndefined();
    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html' });
    expect(config.routes).toEqual(expect.arrayContaining([
      expect.objectContaining({ route: '/assets/*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }),
      expect.objectContaining({ route: '/downloads/tab-context-capsule-1.0.0.zip', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } })
    ]));
  });
});
