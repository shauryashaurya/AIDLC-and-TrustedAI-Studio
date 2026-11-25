// UI navigation state shared between page components (not case data; the case is passed as a prop).
// Page changes are written to the URL hash (#/page) so the browser's Back and Forward buttons work,
// and an in-app history stack powers the "Back to …" button.
import { get, writable } from 'svelte/store';
import type { Page } from './types';

export const PAGES: Page[] = ['home', 'ideate', 'patterns', 'nfr', 'trust', 'lifecycle', 'reports', 'references', 'workshop', 'discover'];
const fromHash = (): Page | null => {
  if (typeof location === 'undefined') return null;
  const p = location.hash.replace(/^#\/?/, '') as Page;
  return PAGES.includes(p) ? p : null;
};

export const page = writable<Page>(fromHash() ?? 'home');
/** Pages visited before the current one (most recent last), for the in-app Back button. */
export const trail = writable<Page[]>([]);
export const notice = writable('');
/** One-shot focus requests set by cross-page links and consumed by the target page. */
export const focus = writable<{ reference?: string; control?: string; stage?: string; node?: string }>({});

export function go(p: Page) {
  const current = get(page);
  if (p === current) return;
  trail.update(t => [...t, current].slice(-30));
  page.set(p);
  if (typeof history !== 'undefined') history.pushState({ page: p }, '', `#/${p}`);
}
/** Returns to the previous page in the in-app trail (uses browser history so Forward still works). */
export function back() {
  const t = get(trail);
  if (!t.length) return;
  if (typeof history !== 'undefined' && history.state?.page) { history.back(); return; }
  const prev = t[t.length - 1];
  trail.set(t.slice(0, -1));
  page.set(prev);
}
/** Called by App on popstate (browser Back/Forward). */
export function syncFromLocation() {
  const p = fromHash() ?? 'home';
  const current = get(page);
  if (p === current) return;
  trail.update(t => (t.length && t[t.length - 1] === p ? t.slice(0, -1) : [...t, current].slice(-30)));
  page.set(p);
}

export const toast = (message: string) => notice.set(message);
export const openReference = (id: string) => { focus.update(f => ({ ...f, reference: id })); go('references'); };
export const openControl = (id: string) => { focus.update(f => ({ ...f, control: id })); go('trust'); };
export const openStage = (id: string) => { focus.update(f => ({ ...f, stage: id })); go('lifecycle'); };
export const openNode = (id: string) => { focus.update(f => ({ ...f, node: id })); go('patterns'); };
export const touch = <T extends { updatedAt: string }>(c: T): T => ({ ...c, updatedAt: new Date().toISOString() });
/** A component asks the shell to open a sample case (by id); App.svelte handles it. */
export const sampleRequest = writable<string | null>(null);
export const requestSample = (id: string) => sampleRequest.set(id);
