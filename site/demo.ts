import {
  capsuleToMarkdown, capsulesToJson, makeCapsule, mergeCapsules, parseCapsuleBundle,
  type Capsule, type CapsuleTab
} from '../src/lib/capsules';

const DEMO_PREFIX = 'demo:tab-context-capsule:';
const DEMO_KEY = `${DEMO_PREFIX}capsules:v1`;

interface DemoTab extends CapsuleTab {
  id: string;
  selected: boolean;
  private: boolean;
}

const savedSample: Capsule = {
  id: 'demo-coastal-erosion',
  name: 'Coastal erosion sources',
  nextStep: 'Compare the two shoreline datasets before Thursday’s meeting.',
  createdAt: '2026-09-04T14:30:00.000Z',
  color: 'coral',
  tabs: [
    { title: 'NOAA shoreline data explorer', url: 'https://coast.noaa.gov/digitalcoast/tools/slr.html', note: 'Export the 2020–2025 shoreline layer.' },
    { title: 'County coastal resilience plan', url: 'https://www.santacruzcountyca.gov/OR3/CoastalResilience.aspx', note: 'Use the setback definition on page 42.' },
    { title: 'USGS coastal change hazards', url: 'https://www.usgs.gov/programs/cmhrp/science/coastal-change-hazards', note: 'Check the erosion-rate method.' }
  ]
};

const freshTabs = (): DemoTab[] => [
  { id: 'heat-plan', title: 'City heat action plan', url: 'https://www.phoenix.gov/heat', note: 'Find funded cooling-center targets.', selected: true, private: false },
  { id: 'temperature-map', title: 'Neighborhood temperature map', url: 'https://ephtracking.cdc.gov/Applications/heatTracker/', note: 'Compare the hottest census tracts.', selected: true, private: false },
  { id: 'tree-study', title: 'Urban tree canopy study', url: 'https://www.epa.gov/heatislands/using-trees-and-vegetation-reduce-heat-islands', note: 'Use the shade-cost estimate.', selected: true, private: false },
  { id: 'interview-notes', title: 'Interview notes — planning team', url: 'https://research.local/interviews/planning-team', note: 'Private notes; include only for this handoff.', selected: false, private: true }
];

let capsules = loadCapsules();
let openTabs = freshTabs();
let includePrivate = false;

const tabList = required<HTMLOListElement>('demo-tabs');
const capsuleList = required<HTMLElement>('demo-capsules');
const tabCount = required<HTMLElement>('sample-tab-count');
const capsuleCount = required<HTMLElement>('capsule-count');
const status = required<HTMLElement>('demo-status');
const captureForm = required<HTMLFormElement>('demo-capture-form');
const privateControl = required<HTMLInputElement>('include-private');
const importControl = required<HTMLInputElement>('demo-import');

captureForm.addEventListener('submit', saveSampleCapsule);
privateControl.addEventListener('change', () => {
  includePrivate = privateControl.checked;
  const privateTab = openTabs.find((tab) => tab.private);
  if (privateTab) privateTab.selected = includePrivate;
  renderTabs();
});
required<HTMLButtonElement>('reset-demo').addEventListener('click', resetDemo);
required<HTMLAnchorElement>('start-real').addEventListener('click', clearDemoStorage);
required<HTMLButtonElement>('export-all-demo').addEventListener('click', () => {
  downloadText('sample-tab-context-capsules.json', capsulesToJson(capsules), 'application/json');
  announce('Exported all sample capsules as JSON.');
});
importControl.addEventListener('change', () => void importSample());

render();

function loadCapsules(): Capsule[] {
  const raw = localStorage.getItem(DEMO_KEY);
  if (raw) {
    try { return parseCapsuleBundle(raw); } catch { localStorage.removeItem(DEMO_KEY); }
  }
  const initial = [structuredClone(savedSample)];
  localStorage.setItem(DEMO_KEY, capsulesToJson(initial));
  return initial;
}

function persist(): void {
  localStorage.setItem(DEMO_KEY, capsulesToJson(capsules));
}

function clearDemoStorage(): void {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(DEMO_PREFIX)) localStorage.removeItem(key);
  }
}

function resetDemo(): void {
  clearDemoStorage();
  capsules = [structuredClone(savedSample)];
  openTabs = freshTabs();
  includePrivate = false;
  privateControl.checked = false;
  required<HTMLInputElement>('demo-name').value = 'Urban heat policy sources';
  required<HTMLInputElement>('demo-next').value = 'Check which cooling targets have funding.';
  persist();
  render();
  announce('Demo reset. The original sample is ready.');
}

function render(): void {
  renderTabs();
  renderCapsules();
}

function renderTabs(): void {
  tabList.replaceChildren();
  tabCount.textContent = `${openTabs.length} sample tab${openTabs.length === 1 ? '' : 's'}`;
  if (openTabs.length === 0) {
    const empty = element('li', 'demo-empty');
    empty.append(element('strong', '', 'No sample tabs are open.'), element('span', '', 'Reopen a saved capsule or reset the demo.'));
    tabList.append(empty);
    return;
  }
  openTabs.forEach((tab, position) => {
    const item = element('li', 'demo-tab');
    item.dataset.tabId = tab.id;
    const includeLabel = element('label', 'demo-tab-check');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = tab.selected;
    checkbox.disabled = tab.private && !includePrivate;
    checkbox.setAttribute('aria-label', `Include ${tab.title}`);
    checkbox.addEventListener('change', () => { tab.selected = checkbox.checked; });
    const copy = element('span', 'demo-tab-copy');
    const title = element('strong', '', tab.title);
    if (tab.private) title.append(element('span', 'private-badge', 'Private sample'));
    copy.append(title, element('small', '', tab.url));
    includeLabel.append(checkbox, copy);

    const controls = element('span', 'demo-order');
    const up = actionButton('Move up', `Move ${tab.title} up`, () => moveTab(tab.id, -1));
    const down = actionButton('Move down', `Move ${tab.title} down`, () => moveTab(tab.id, 1));
    up.disabled = position === 0;
    down.disabled = position === openTabs.length - 1;
    controls.append(up, down);

    const noteLabel = element('label', 'demo-note');
    noteLabel.append(element('span', '', `Note for ${tab.title}`));
    const note = document.createElement('input');
    note.value = tab.note;
    note.maxLength = 300;
    note.addEventListener('input', () => { tab.note = note.value; });
    noteLabel.append(note);
    item.append(includeLabel, controls, noteLabel);
    tabList.append(item);
  });
}

function moveTab(id: string, change: -1 | 1): void {
  const from = openTabs.findIndex((tab) => tab.id === id);
  const to = from + change;
  if (from < 0 || to < 0 || to >= openTabs.length) return;
  [openTabs[from], openTabs[to]] = [openTabs[to], openTabs[from]];
  renderTabs();
  tabList.querySelector<HTMLButtonElement>(`[data-tab-id="${id}"] button:not(:disabled)`)?.focus();
}

function saveSampleCapsule(event: SubmitEvent): void {
  event.preventDefault();
  const selected = openTabs.filter((tab) => tab.selected && (!tab.private || includePrivate));
  const closeAfterSave = required<HTMLInputElement>('close-samples').checked;
  if (closeAfterSave && !window.confirm(`Save this capsule, then close ${selected.length} selected sample tab${selected.length === 1 ? '' : 's'}?`)) {
    announce('Nothing changed. The selected sample tabs are still open.');
    return;
  }
  try {
    const capsule = makeCapsule({
      name: required<HTMLInputElement>('demo-name').value,
      nextStep: required<HTMLInputElement>('demo-next').value,
      tabs: selected.map(({ title, url, note }) => ({ title, url, note }))
    });
    capsules.unshift(capsule);
    persist();
    if (closeAfterSave) openTabs = openTabs.filter((tab) => !selected.includes(tab));
    includePrivate = false;
    privateControl.checked = false;
    required<HTMLInputElement>('close-samples').checked = false;
    render();
    announce(`Saved “${capsule.name}” in demo storage${closeAfterSave ? ` and closed ${selected.length} sample tabs` : ''}.`);
  } catch (error) {
    announce(error instanceof Error ? error.message : 'The sample capsule could not be saved.');
  }
}

function renderCapsules(): void {
  capsuleList.replaceChildren();
  capsuleCount.textContent = `${capsules.length} saved`;
  required<HTMLButtonElement>('export-all-demo').disabled = capsules.length === 0;
  if (capsules.length === 0) {
    const empty = element('div', 'demo-empty');
    empty.append(element('strong', '', 'No sample capsules are saved.'), element('span', '', 'Save the selected sample tabs or reset the demo.'));
    capsuleList.append(empty);
    return;
  }
  capsules.forEach((capsule) => {
    const card = element('article', 'demo-capsule');
    card.dataset.capsuleId = capsule.id;
    const meta = element('p', 'demo-card-meta', `${capsule.tabs.length} tab${capsule.tabs.length === 1 ? '' : 's'} · Saved in demo storage`);
    const heading = element('h3', '', capsule.name);
    const next = element('p', 'demo-next-step');
    next.append(element('strong', '', 'Next step'), document.createTextNode(capsule.nextStep || 'No next step recorded.'));
    const tabs = document.createElement('ol');
    capsule.tabs.forEach((tab) => {
      const item = document.createElement('li');
      item.append(element('strong', '', tab.title), element('small', '', tab.note || tab.url));
      tabs.append(item);
    });
    const actions = element('div', 'demo-card-actions');
    actions.append(
      actionButton(`Reopen ${capsule.tabs.length} sample tabs`, '', () => reopenCapsule(capsule)),
      actionButton('Export Markdown', '', () => {
        downloadText(`${safeFilename(capsule.name)}.md`, capsuleToMarkdown(capsule), 'text/markdown');
        announce(`Exported “${capsule.name}” as readable Markdown.`);
      }),
      actionButton('Export JSON', '', () => {
        downloadText(`${safeFilename(capsule.name)}.json`, capsulesToJson([capsule]), 'application/json');
        announce(`Exported “${capsule.name}” as JSON.`);
      }),
      actionButton(`Delete ${capsule.name}`, '', () => deleteCapsule(capsule), 'danger-button')
    );
    card.append(meta, heading, next, tabs, actions);
    capsuleList.append(card);
  });
}

function reopenCapsule(capsule: Capsule): void {
  let added = 0;
  capsule.tabs.forEach((tab, index) => {
    const id = `reopened-${capsule.id}-${index}`;
    if (!openTabs.some((open) => open.id === id)) {
      openTabs.push({ ...tab, id, selected: true, private: false });
      added += 1;
    }
  });
  renderTabs();
  announce(`Reopened ${added} sample tab${added === 1 ? '' : 's'}. No real browser tabs were changed.`);
}

function deleteCapsule(capsule: Capsule): void {
  if (!window.confirm(`Delete the sample capsule “${capsule.name}”?`)) return;
  capsules = capsules.filter((item) => item.id !== capsule.id);
  persist();
  renderCapsules();
  announce(`Deleted the sample capsule “${capsule.name}”. Reset the demo to restore it.`);
}

async function importSample(): Promise<void> {
  const file = importControl.files?.[0];
  if (!file) return;
  if (file.size > 5_000_000) {
    announce('That file is too large. Choose a JSON file under 5 MB.');
    importControl.value = '';
    return;
  }
  try {
    const imported = parseCapsuleBundle(await file.text());
    capsules = mergeCapsules(capsules, imported);
    persist();
    renderCapsules();
    announce(`Imported ${imported.length} sample capsule${imported.length === 1 ? '' : 's'} into demo storage.`);
  } catch (error) {
    announce(error instanceof Error ? error.message : 'The sample file could not be imported.');
  }
  importControl.value = '';
}

function actionButton(label: string, ariaLabel: string, handler: () => void, className = ''): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `text-button ${className}`.trim();
  button.textContent = label;
  if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
  button.addEventListener('click', handler);
  return button;
}

function downloadText(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function safeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'sample-capsule';
}

function announce(message: string): void {
  status.textContent = message;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function required<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing demo element: ${id}`);
  return node as T;
}
