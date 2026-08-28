import { browser } from 'wxt/browser';
import './style.css';
import {
  STORAGE_KEY, capsuleToMarkdown, capsulesToJson, isCapturableUrl, makeCapsule,
  mergeCapsules, parseCapsuleBundle, type Capsule, type CapsuleColor
} from '../../lib/capsules';
import { downloadText, safeFilename } from '../../lib/download';
import {
  CHECKOUT_URL, DAY_MS, LICENSE_KEY, VERDICT_KEY, hasCachedValidVerdict, verifyUrl,
  type LicenseVerdict
} from '../../lib/license';

type Route = 'capture' | 'library' | 'unlock';
interface DraftTab { browserId: number; title: string; url: string; note: string; selected: boolean; pinned: boolean; incognito: boolean; }

const state: { capsules: Capsule[]; draftTabs: DraftTab[]; route: Route; pro: boolean; loadError: string; privateOptIn: boolean; draftName: string; draftNext: string; draftColor: CapsuleColor } = {
  capsules: [], draftTabs: [], route: 'capture', pro: false, loadError: '', privateOptIn: false,
  draftName: '', draftNext: '', draftColor: 'coral'
};

const loading = byId('loading');
const captureView = byId('capture-view');
const libraryView = byId('library-view');
const unlockView = byId('unlock-view');
const toast = byId('toast');
let toastTimer = 0;
let lastDeleted: { capsule: Capsule; index: number } | null = null;

document.querySelectorAll<HTMLButtonElement>('[data-route]').forEach((button) => {
  button.addEventListener('click', () => navigate(button.dataset.route as Route));
});

void initialize();

async function initialize(): Promise<void> {
  captureLicenseFromUrl();
  state.pro = hasCachedValidVerdict(localStorage.getItem(VERDICT_KEY));
  await Promise.all([loadCapsules(), loadWindowTabs()]);
  loading.hidden = true;
  renderAll();
  void refreshLicense();
}

async function loadCapsules(): Promise<void> {
  try {
    const stored = await browser.storage.local.get(STORAGE_KEY);
    state.capsules = Array.isArray(stored[STORAGE_KEY]) ? stored[STORAGE_KEY] as Capsule[] : [];
  } catch {
    state.loadError = 'Capsules could not be read. Check that extension storage is available, then reopen this panel.';
  }
}

async function loadWindowTabs(): Promise<void> {
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    state.draftTabs = tabs
      .filter((tab) => typeof tab.id === 'number' && typeof tab.url === 'string' && isCapturableUrl(tab.url))
      .map((tab) => ({
        browserId: tab.id!, title: tab.title || tab.url!, url: tab.url!, note: '',
        selected: !tab.pinned && !tab.incognito, pinned: Boolean(tab.pinned), incognito: Boolean(tab.incognito)
      }));
  } catch {
    state.loadError = 'Tabs could not be read. Reload the extension and try again.';
  }
}

function renderAll(): void {
  byId('capsule-count').textContent = String(state.capsules.length);
  renderCapture();
  renderLibrary();
  renderUnlock();
  showRoute();
}

function navigate(route: Route): void {
  state.route = route;
  showRoute();
  const heading = document.querySelector<HTMLElement>(`#${route}-view h2`);
  heading?.focus();
}

function showRoute(): void {
  captureView.hidden = state.route !== 'capture';
  libraryView.hidden = state.route !== 'library';
  unlockView.hidden = state.route !== 'unlock';
  document.querySelectorAll<HTMLButtonElement>('[data-route]').forEach((button) => {
    if (button.dataset.route === state.route) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function renderCapture(): void {
  captureView.replaceChildren();
  captureView.append(
    el('p', { class: 'station-label', text: 'Departure · Current window' }),
    heading('capture-title', 'Seal the useful context'),
    el('p', { class: 'lede', text: 'Choose the pages that matter, write down why, then close the noise with confidence.' })
  );
  if (state.loadError) captureView.append(el('div', { class: 'error-panel', role: 'alert', text: state.loadError }));
  if (!state.draftTabs.length) {
    const empty = el('div', { class: 'empty-state' });
    empty.append(el('div', { class: 'empty-mark', ariaHidden: 'true' }), el('h3', { text: 'No web tabs at this station' }), el('p', { text: 'Open a regular web page in this window, then reopen the extension.' }));
    captureView.append(empty);
    return;
  }

  const form = el('form', { ariaLabel: 'Create capsule' }) as HTMLFormElement;
  const nameControl = input('capsule-name', 'text', 'e.g. Coastal erosion sources', true, 120);
  nameControl.value = state.draftName;
  nameControl.addEventListener('input', () => { state.draftName = nameControl.value; });
  const nextControl = textarea('next-step', 'What should happen when you resume?', 300);
  nextControl.value = state.draftNext;
  nextControl.addEventListener('input', () => { state.draftNext = nextControl.value; });
  form.append(field('capsule-name', 'Capsule name', nameControl), field('next-step', 'Next step ', nextControl, true));

  if (state.pro) {
    const select = el('select', { id: 'capsule-color', name: 'capsule-color' }) as HTMLSelectElement;
    [['coral','Signal coral'],['brass','Brass'],['jade','Jade']].forEach(([value, label]) => select.append(el('option', { value, text: label })));
    select.value = state.draftColor;
    select.addEventListener('change', () => { state.draftColor = select.value as CapsuleColor; });
    form.append(field('capsule-color', 'Ticket color ', select, true));
  }

  form.append(el('p', { class: 'section-rule', text: 'Carriages · tabs' }));
  const selectRow = el('div', { class: 'select-row' });
  const selectedCount = state.draftTabs.filter((tab) => tab.selected && (!tab.incognito || state.privateOptIn)).length;
  selectRow.append(el('span', { id: 'selected-count', text: `${selectedCount} selected` }));
  const toggleAll = el('button', { class: 'text-button', type: 'button', text: selectedCount ? 'Clear regular tabs' : 'Select regular tabs' }) as HTMLButtonElement;
  toggleAll.addEventListener('click', () => {
    const shouldSelect = !state.draftTabs.some((tab) => tab.selected && !tab.incognito);
    state.draftTabs.forEach((tab) => { if (!tab.incognito) tab.selected = shouldSelect; });
    renderCapture();
  });
  selectRow.append(toggleAll);
  form.append(selectRow);

  const privateTabs = state.draftTabs.filter((tab) => tab.incognito);
  if (privateTabs.length) {
    const privateBox = el('div', { class: 'private-callout' });
    const privateLabel = el('label', { class: 'check-row' });
    const privateCheck = el('input', { type: 'checkbox', checked: state.privateOptIn }) as HTMLInputElement;
    privateCheck.addEventListener('change', () => { state.privateOptIn = privateCheck.checked; renderCapture(); });
    const privateText = el('span');
    privateText.append(document.createTextNode(`Include ${privateTabs.length} private tab${privateTabs.length === 1 ? '' : 's'} this time`), el('small', { text: 'Off by default. If selected, their URLs and notes will be saved locally in this browser profile.' }));
    privateLabel.append(privateCheck, privateText);
    privateBox.append(privateLabel);
    form.append(privateBox);
  }

  const list = el('ol', { class: 'tab-list', ariaLabel: 'Tabs in capsule order' });
  state.draftTabs.filter((tab) => !tab.incognito || state.privateOptIn).forEach((tab) => list.append(renderDraftTab(tab)));
  form.append(list);

  const closeLabel = el('label', { class: 'check-row' });
  const closeInput = el('input', { id: 'close-originals', type: 'checkbox' });
  const closeText = el('span');
  closeText.append(document.createTextNode('Close selected originals after saving'), el('small', { text: 'You will confirm the exact number first. Pinned tabs are never selected automatically.' }));
  closeLabel.append(closeInput, closeText);
  form.append(closeLabel);
  const buttons = el('div', { class: 'button-row' });
  const save = el('button', { class: 'button primary', type: 'submit', text: 'Seal capsule' });
  const library = el('button', { class: 'button', type: 'button', text: 'View library' });
  library.addEventListener('click', () => navigate('library'));
  buttons.append(save, library);
  form.append(buttons, el('p', { class: 'sensitive-note', text: 'Nothing leaves your device. Exports can contain sensitive links—share them deliberately.' }));
  form.addEventListener('submit', (event) => void saveDraft(event));
  captureView.append(form);
}

function renderDraftTab(tab: DraftTab): HTMLElement {
  const item = el('li', { class: `tab-ticket${tab.pinned ? ' is-pinned' : ''}` });
  const head = el('div', { class: 'tab-head' });
  const check = el('input', { type: 'checkbox', checked: tab.selected, ariaLabel: `Include ${tab.title}` }) as HTMLInputElement;
  check.addEventListener('change', () => { tab.selected = check.checked; updateSelectedCount(); });
  const copy = el('div', { class: 'tab-copy' });
  const title = el('span', { class: 'tab-title', text: tab.title, title: tab.title });
  if (tab.pinned) title.append(el('span', { class: 'pin-label', text: 'Pinned' }));
  copy.append(title, el('span', { class: 'tab-url', text: hostname(tab.url), title: tab.url }));
  const controls = el('div', { class: 'order-controls' });
  const visible = state.draftTabs.filter((entry) => !entry.incognito || state.privateOptIn);
  const position = visible.indexOf(tab);
  const up = el('button', { class: 'icon-button', type: 'button', text: '↑', ariaLabel: `Move ${tab.title} up`, disabled: position === 0 }) as HTMLButtonElement;
  const down = el('button', { class: 'icon-button', type: 'button', text: '↓', ariaLabel: `Move ${tab.title} down`, disabled: position === visible.length - 1 }) as HTMLButtonElement;
  up.addEventListener('click', () => moveTab(tab, -1)); down.addEventListener('click', () => moveTab(tab, 1));
  controls.append(up, down); head.append(check, copy, controls);
  const note = el('input', { class: 'tab-note', type: 'text', value: tab.note, maxlength: '300', placeholder: 'Why does this page matter?', ariaLabel: `Note for ${tab.title}` }) as HTMLInputElement;
  note.addEventListener('input', () => { tab.note = note.value; });
  item.append(head, note);
  return item;
}

function moveTab(tab: DraftTab, direction: -1 | 1): void {
  const visible = state.draftTabs.filter((entry) => !entry.incognito || state.privateOptIn);
  const current = visible.indexOf(tab);
  const other = visible[current + direction];
  if (!other) return;
  const a = state.draftTabs.indexOf(tab); const b = state.draftTabs.indexOf(other);
  [state.draftTabs[a], state.draftTabs[b]] = [state.draftTabs[b], state.draftTabs[a]];
  renderCapture();
  const buttons = captureView.querySelectorAll<HTMLButtonElement>(direction < 0 ? '[aria-label^="Move"][aria-label$="up"]' : '[aria-label^="Move"][aria-label$="down"]');
  [...buttons].find((button) => button.getAttribute('aria-label')?.includes(tab.title))?.focus();
}

function updateSelectedCount(): void {
  const count = state.draftTabs.filter((tab) => tab.selected && (!tab.incognito || state.privateOptIn)).length;
  const target = document.querySelector('#selected-count');
  if (target) target.textContent = `${count} selected`;
}

async function saveDraft(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);
  const selected = state.draftTabs.filter((tab) => tab.selected && (!tab.incognito || state.privateOptIn));
  const closeOriginals = (form.querySelector('#close-originals') as HTMLInputElement).checked;
  if (closeOriginals && !window.confirm(`Save this capsule, then close ${selected.length} selected tab${selected.length === 1 ? '' : 's'}?`)) return;
  try {
    const capsule = makeCapsule({
      name: String(formData.get('capsule-name') ?? state.draftName),
      nextStep: String(formData.get('next-step') ?? state.draftNext),
      color: state.pro ? String(formData.get('capsule-color') ?? state.draftColor) as CapsuleColor : 'coral',
      tabs: selected.map(({ title, url, note }) => ({ title, url, note }))
    });
    state.capsules.unshift(capsule);
    await persistCapsules();
    if (closeOriginals) {
      try { await browser.tabs.remove(selected.map((tab) => tab.browserId)); }
      catch { showToast('Capsule saved, but one or more original tabs could not be closed.'); }
    } else showToast(`“${capsule.name}” saved locally.`);
    state.draftTabs = state.draftTabs.filter((tab) => !selected.includes(tab));
    state.draftName = ''; state.draftNext = ''; state.draftColor = 'coral'; state.privateOptIn = false;
    state.route = 'library';
    renderAll();
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Capsule could not be saved.');
  }
}

function renderLibrary(): void {
  libraryView.replaceChildren();
  libraryView.append(el('p', { class: 'station-label', text: 'Arrivals · On this device' }), heading('library-title', 'Capsule library'), el('p', { class: 'lede', text: 'Reopen the route, or detach a portable ticket for someone else.' }));
  if (!state.capsules.length) {
    const empty = el('div', { class: 'empty-state' });
    empty.append(el('div', { class: 'empty-mark', ariaHidden: 'true' }), el('h3', { text: 'The platform is clear' }), el('p', { text: 'Your first saved context will wait here—even after the original tabs are gone.' }));
    const action = el('button', { class: 'button primary', type: 'button', text: 'Capture current tabs' });
    action.addEventListener('click', () => navigate('capture')); empty.append(action); libraryView.append(empty);
  } else {
    const list = el('ol', { class: 'capsule-list' });
    state.capsules.forEach((capsule) => list.append(renderCapsule(capsule)));
    libraryView.append(list);
  }
  const importRow = el('div', { class: 'import-row button-row' });
  const fileLabel = el('label', { class: 'button file-label', text: 'Import JSON' });
  const file = el('input', { type: 'file', accept: 'application/json,.json', ariaLabel: 'Import capsule JSON file' }) as HTMLInputElement;
  file.addEventListener('change', () => void importBundle(file)); fileLabel.append(file);
  const exportAll = el('button', { class: 'button', type: 'button', text: 'Export all JSON', disabled: state.capsules.length === 0 }) as HTMLButtonElement;
  exportAll.addEventListener('click', () => downloadText('tab-context-capsules.json', capsulesToJson(state.capsules), 'application/json'));
  importRow.append(fileLabel, exportAll); libraryView.append(importRow, el('p', { class: 'sensitive-note', text: 'JSON is the lossless backup format. Imported capsules stay in extension storage on this device.' }));
}

function renderCapsule(capsule: Capsule): HTMLElement {
  const item = el('li', { class: 'capsule-card', dataColor: capsule.color });
  const meta = el('div', { class: 'capsule-meta' });
  meta.append(el('span', { text: `${capsule.tabs.length} tab${capsule.tabs.length === 1 ? '' : 's'}` }), el('time', { text: friendlyDate(capsule.createdAt), dateTime: capsule.createdAt }));
  item.append(meta, el('h3', { text: capsule.name }));
  if (capsule.nextStep) item.append(el('p', { class: 'next-step', text: `Next: ${capsule.nextStep}` }));
  const actions = el('div', { class: 'capsule-actions' });
  const open = el('button', { class: 'button primary', type: 'button', text: `Open ${capsule.tabs.length} tabs` });
  open.addEventListener('click', () => void openCapsule(capsule));
  const markdown = el('button', { class: 'button', type: 'button', text: 'Export Markdown' });
  markdown.addEventListener('click', () => downloadText(`${safeFilename(capsule.name)}.md`, capsuleToMarkdown(capsule), 'text/markdown'));
  actions.append(open, markdown); item.append(actions);
  const more = el('div', { class: 'overflow-row' });
  const json = el('button', { class: 'text-button', type: 'button', text: 'Export JSON' });
  json.addEventListener('click', () => downloadText(`${safeFilename(capsule.name)}.json`, capsulesToJson([capsule]), 'application/json'));
  const copy = el('button', { class: 'text-button', type: 'button', text: state.pro ? 'Copy Markdown' : 'Copy Markdown · Conductor' });
  copy.addEventListener('click', () => state.pro ? void copyMarkdown(capsule) : navigate('unlock'));
  const remove = el('button', { class: 'text-button', type: 'button', text: 'Delete', ariaLabel: `Delete ${capsule.name}` });
  remove.addEventListener('click', () => void deleteCapsule(capsule));
  more.append(json, copy, remove); item.append(more);
  return item;
}

async function openCapsule(capsule: Capsule): Promise<void> {
  let opened = 0;
  for (const tab of capsule.tabs) {
    try { await browser.tabs.create({ url: tab.url, active: opened === 0 }); opened += 1; } catch { /* continue with remaining safe URLs */ }
  }
  showToast(opened === capsule.tabs.length ? `Opened ${opened} tabs from “${capsule.name}”.` : `Opened ${opened} of ${capsule.tabs.length} tabs. Some were blocked by the browser.`);
}

async function copyMarkdown(capsule: Capsule): Promise<void> {
  try { await navigator.clipboard.writeText(capsuleToMarkdown(capsule)); showToast('Markdown copied to the clipboard.'); }
  catch { showToast('Clipboard access was blocked. Use Export Markdown instead.'); }
}

async function deleteCapsule(capsule: Capsule): Promise<void> {
  if (!window.confirm(`Delete “${capsule.name}” and its ${capsule.tabs.length} saved tab${capsule.tabs.length === 1 ? '' : 's'}?`)) return;
  const index = state.capsules.indexOf(capsule); lastDeleted = { capsule, index };
  state.capsules.splice(index, 1); await persistCapsules(); renderAll();
  showToast('Capsule deleted.', 'Undo', () => void undoDelete());
}

async function undoDelete(): Promise<void> {
  if (!lastDeleted) return;
  state.capsules.splice(lastDeleted.index, 0, lastDeleted.capsule); lastDeleted = null;
  await persistCapsules(); renderAll(); showToast('Capsule restored.');
}

async function importBundle(file: HTMLInputElement): Promise<void> {
  const selected = file.files?.[0]; if (!selected) return;
  if (selected.size > 5_000_000) { showToast('That file is too large (maximum 5 MB).'); return; }
  try {
    const imported = parseCapsuleBundle(await selected.text());
    state.capsules = mergeCapsules(state.capsules, imported); await persistCapsules(); renderAll();
    showToast(`Imported ${imported.length} capsule${imported.length === 1 ? '' : 's'}.`);
  } catch (error) { showToast(error instanceof Error ? error.message : 'The file could not be imported.'); }
  file.value = '';
}

function renderUnlock(): void {
  unlockView.replaceChildren();
  unlockView.append(el('p', { class: 'station-label', text: 'Conductor class · One-time' }), heading('unlock-title', 'A faster handoff'), el('p', { class: 'lede', text: 'The complete capture, reopen, Markdown, JSON, and import journey is free. Conductor adds finishing conveniences.' }));
  const fare = el('div', { class: 'fare-card' });
  const status = el('p', { class: `license-state${state.pro ? ' is-valid' : ''}`, text: state.pro ? '● Conductor unlocked on this device' : '○ Free ticket active' });
  fare.append(status, el('div', { class: 'fare', text: '$12 ' }));
  fare.querySelector('.fare')!.append(el('small', { text: 'USD · one-time purchase' }));
  const features = el('ul', { class: 'feature-list' });
  ['Copy a capsule as Markdown in one click', 'Color-code capsules with brass and jade tickets', 'Support a private, local-first utility'].forEach((text) => features.append(el('li', { text })));
  fare.append(features);
  if (!state.pro) {
    const buy = el('a', { class: 'button brass', href: CHECKOUT_URL, target: '_blank', rel: 'noreferrer', text: 'Buy Conductor — $12' });
    fare.append(buy);
  }
  unlockView.append(fare);
  const form = el('form', { class: 'license-form', ariaLabel: 'Restore purchase' }) as HTMLFormElement;
  form.append(field('license-token', 'Have a license? Paste it here', input('license-token', 'password', 'License token', true, 500)));
  const restore = el('button', { class: 'button', type: 'submit', text: 'Verify and restore' });
  form.append(restore);
  form.addEventListener('submit', (event) => void restoreLicense(event));
  unlockView.append(form);
  const legal = el('div', { class: 'legal-links' });
  legal.append(externalLink('Privacy', 'https://tab-context-capsule.sociobot.in/privacy/'), externalLink('Terms & refunds', 'https://tab-context-capsule.sociobot.in/terms/'));
  unlockView.append(legal, el('p', { class: 'sensitive-note', text: 'Sociobot/Dodo is the merchant of record. A refunded purchase revokes its license automatically. License checks never include capsule names, notes, or URLs.' }));
}

async function restoreLicense(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const token = String(new FormData(form).get('license-token') ?? '').trim();
  if (!token) { showToast('Paste your license token first.'); return; }
  localStorage.setItem(LICENSE_KEY, token);
  await refreshLicense(true);
}

function captureLicenseFromUrl(): void {
  const url = new URL(window.location.href); const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(LICENSE_KEY, token); url.searchParams.delete('license'); history.replaceState({}, '', url);
}

async function refreshLicense(force = false): Promise<void> {
  const token = localStorage.getItem(LICENSE_KEY); if (!token) return;
  const cached = localStorage.getItem(VERDICT_KEY);
  if (!force && cached) {
    try { const verdict = JSON.parse(cached) as LicenseVerdict; if (Date.now() - verdict.checkedAt < DAY_MS) return; } catch { /* verify */ }
  }
  try {
    const response = await fetch(verifyUrl(token), { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('verify unavailable');
    const data = await response.json() as { valid: boolean; reason: string };
    const verdict: LicenseVerdict = { valid: data.valid, reason: data.reason, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict)); state.pro = data.valid; renderAll();
    showToast(data.valid ? 'Conductor restored on this device.' : 'That license is not active. Check the token or buy a new license.');
  } catch {
    if (force) showToast('License verification is offline. Your free features still work; try again when connected.');
  }
}

async function persistCapsules(): Promise<void> { await browser.storage.local.set({ [STORAGE_KEY]: state.capsules }); }

function showToast(message: string, action?: string, callback?: () => void): void {
  window.clearTimeout(toastTimer); toast.replaceChildren(document.createTextNode(message));
  if (action && callback) { const button = el('button', { class: 'text-button', type: 'button', text: action }); button.addEventListener('click', callback); toast.append(button); }
  toast.hidden = false; toastTimer = window.setTimeout(() => { toast.hidden = true; }, 5000);
}

function heading(id: string, text: string): HTMLElement { return el('h2', { id, text, tabindex: '-1' }); }
function byId(id: string): HTMLElement { return document.getElementById(id)!; }
function hostname(url: string): string { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } }
function friendlyDate(value: string): string { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)); }
function externalLink(text: string, href: string): HTMLAnchorElement { return el('a', { text, href, target: '_blank', rel: 'noreferrer' }) as HTMLAnchorElement; }

function input(id: string, type: string, placeholder: string, required = false, maxlength = 200): HTMLInputElement {
  return el('input', { id, name: id, type, placeholder, required, maxlength: String(maxlength), autocomplete: 'off' }) as HTMLInputElement;
}
function textarea(id: string, placeholder: string, maxlength = 500): HTMLTextAreaElement {
  return el('textarea', { id, name: id, placeholder, maxlength: String(maxlength) }) as HTMLTextAreaElement;
}
function field(id: string, labelText: string, control: HTMLElement, optional = false): HTMLElement {
  const wrapper = el('label', { class: 'field', htmlFor: id }); const label = el('span', { text: labelText });
  if (optional) label.append(el('span', { class: 'optional', text: 'optional' })); wrapper.append(label, control); return wrapper;
}

function el(tag: string, attrs: Record<string, unknown> = {}): HTMLElement {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === false) return;
    if (key === 'text') node.textContent = String(value);
    else if (key === 'class') node.className = String(value);
    else if (key === 'ariaLabel') node.setAttribute('aria-label', String(value));
    else if (key === 'ariaHidden') node.setAttribute('aria-hidden', String(value));
    else if (key === 'dataColor') node.dataset.color = String(value);
    else if (key in node) (node as unknown as Record<string, unknown>)[key] = value;
    else node.setAttribute(key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), String(value));
  });
  return node;
}
