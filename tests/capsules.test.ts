import { describe, expect, it, vi } from 'vitest';
import { capsuleToMarkdown, capsulesToJson, isCapturableUrl, makeCapsule, mergeCapsules, parseCapsuleBundle } from '../src/lib/capsules';

describe('capsule domain', () => {
  it('creates a trimmed capsule and preserves tab order', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'capsule-1' });
    const capsule = makeCapsule({
      name: '  Research handoff ', nextStep: ' Compare evidence ', now: new Date('2026-08-28T12:00:00Z'),
      tabs: [
        { title: ' Second ', url: 'https://example.com/2', note: ' useful ' },
        { title: 'First', url: 'https://example.com/1', note: '' }
      ]
    });
    expect(capsule).toMatchObject({ id: 'capsule-1', name: 'Research handoff', nextStep: 'Compare evidence' });
    expect(capsule.tabs.map((tab) => tab.url)).toEqual(['https://example.com/2', 'https://example.com/1']);
  });

  it('rejects empty capsules and internal browser URLs', () => {
    expect(isCapturableUrl('chrome://settings')).toBe(false);
    expect(isCapturableUrl('https://example.com')).toBe(true);
    expect(() => makeCapsule({ name: 'Nothing', nextStep: '', tabs: [{ title: 'Settings', url: 'chrome://settings', note: '' }] })).toThrow('Select at least one web tab');
  });

  it('exports readable Markdown with meaning and next step', () => {
    const capsule = makeCapsule({ id: 'c1', name: 'Field notes', nextStep: 'Draft the memo', now: new Date('2026-08-28T12:00:00Z'), tabs: [{ title: 'Page [one]', url: 'https://example.com/a(b)', note: 'Primary source' }] });
    const markdown = capsuleToMarkdown(capsule);
    expect(markdown).toContain('# Field notes');
    expect(markdown).toContain('**Next step:** Draft the memo');
    expect(markdown).toContain('[Page \\[one\\]](https://example.com/a%28b%29) — Primary source');
  });

  it('round-trips and merges JSON bundles by id', () => {
    const capsule = makeCapsule({ id: 'same', name: 'Imported', nextStep: '', now: new Date('2026-08-28T12:00:00Z'), tabs: [{ title: 'Page', url: 'https://example.com', note: '' }] });
    const imported = parseCapsuleBundle(capsulesToJson([capsule]));
    expect(imported).toEqual([capsule]);
    expect(mergeCapsules([{ ...capsule, name: 'Old' }], imported)).toEqual([capsule]);
  });

  it('rejects arbitrary JSON and unsafe imported URLs', () => {
    expect(() => parseCapsuleBundle('{"hello":"world"}')).toThrow('Choose a Tab Context Capsule');
    const bad = JSON.stringify({ product: 'tab-context-capsule', version: 1, capsules: [{ id: 'x', name: 'Bad', nextStep: '', createdAt: new Date().toISOString(), tabs: [{ title: 'Local', url: 'file:///secret', note: '' }] }] });
    expect(() => parseCapsuleBundle(bad)).toThrow('invalid or unsupported tab');
  });
});
