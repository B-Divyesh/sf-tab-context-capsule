export type CapsuleColor = 'coral' | 'brass' | 'jade';

export interface CapsuleTab {
  title: string;
  url: string;
  note: string;
}

export interface Capsule {
  id: string;
  name: string;
  nextStep: string;
  createdAt: string;
  color: CapsuleColor;
  tabs: CapsuleTab[];
}

export interface CapsuleBundle {
  product: 'tab-context-capsule';
  version: 1;
  exportedAt: string;
  capsules: Capsule[];
}

export const STORAGE_KEY = 'capsules:v1';

export function makeCapsule(input: {
  name: string;
  nextStep: string;
  color?: CapsuleColor;
  tabs: CapsuleTab[];
  now?: Date;
  id?: string;
}): Capsule {
  const name = input.name.trim();
  if (!name) throw new Error('Give this capsule a name.');
  const tabs = input.tabs
    .map((tab) => ({ title: tab.title.trim() || tab.url, url: tab.url.trim(), note: tab.note.trim() }))
    .filter((tab) => isCapturableUrl(tab.url));
  if (!tabs.length) throw new Error('Select at least one web tab.');
  return {
    id: input.id ?? crypto.randomUUID(),
    name,
    nextStep: input.nextStep.trim(),
    createdAt: (input.now ?? new Date()).toISOString(),
    color: input.color ?? 'coral',
    tabs
  };
}

export function isCapturableUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function capsuleToMarkdown(capsule: Capsule): string {
  const lines = [`# ${capsule.name}`, '', `Saved ${formatDate(capsule.createdAt)}`];
  if (capsule.nextStep) lines.push('', `**Next step:** ${capsule.nextStep}`);
  lines.push('', '## Tabs', '');
  capsule.tabs.forEach((tab, index) => {
    lines.push(`${index + 1}. [${escapeLabel(tab.title)}](${escapeUrl(tab.url)})${tab.note ? ` — ${tab.note}` : ''}`);
  });
  lines.push('', '_Exported locally with Tab Context Capsule._', '');
  return lines.join('\n');
}

export function capsulesToJson(capsules: Capsule[]): string {
  const bundle: CapsuleBundle = {
    product: 'tab-context-capsule',
    version: 1,
    exportedAt: new Date().toISOString(),
    capsules
  };
  return JSON.stringify(bundle, null, 2);
}

export function parseCapsuleBundle(text: string): Capsule[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!isRecord(data) || data.product !== 'tab-context-capsule' || data.version !== 1 || !Array.isArray(data.capsules)) {
    throw new Error('Choose a Tab Context Capsule JSON export.');
  }
  if (data.capsules.length > 500) throw new Error('This bundle is too large (maximum 500 capsules).');
  return data.capsules.map((item) => validateCapsule(item));
}

export function mergeCapsules(existing: Capsule[], incoming: Capsule[]): Capsule[] {
  const byId = new Map(existing.map((capsule) => [capsule.id, capsule]));
  incoming.forEach((capsule) => byId.set(capsule.id, capsule));
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function validateCapsule(value: unknown): Capsule {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' ||
      typeof value.nextStep !== 'string' || typeof value.createdAt !== 'string' || !Array.isArray(value.tabs)) {
    throw new Error('One of the capsules is incomplete.');
  }
  if (value.tabs.length < 1 || value.tabs.length > 200) throw new Error('A capsule must contain 1–200 tabs.');
  const tabs = value.tabs.map((tab) => {
    if (!isRecord(tab) || typeof tab.title !== 'string' || typeof tab.url !== 'string' || typeof tab.note !== 'string' || !isCapturableUrl(tab.url)) {
      throw new Error('A capsule contains an invalid or unsupported tab.');
    }
    return { title: tab.title.slice(0, 500), url: tab.url, note: tab.note.slice(0, 1000) };
  });
  const color: CapsuleColor = value.color === 'brass' || value.color === 'jade' ? value.color : 'coral';
  return {
    id: value.id.slice(0, 200),
    name: value.name.trim().slice(0, 200),
    nextStep: value.nextStep.trim().slice(0, 1000),
    createdAt: Number.isNaN(Date.parse(value.createdAt)) ? new Date().toISOString() : value.createdAt,
    color,
    tabs
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function escapeLabel(value: string): string {
  return value.replaceAll('[', '\\[').replaceAll(']', '\\]');
}

function escapeUrl(value: string): string {
  return value.replaceAll('(', '%28').replaceAll(')', '%29');
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}
