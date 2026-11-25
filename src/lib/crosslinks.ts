// Where in the studio each AI-DLC stage and each control is worked on (studio mapping, used for cross-links).
import type { Page } from './types';

/** Studio pages that hold the inputs for an AI-DLC stage. */
export function pagesForStage(stageId: string): Page[] {
  const [phase] = stageId.split('.');
  const map: Record<string, Page[]> = {
    '1.1': ['ideate'], '1.2': ['ideate'], '1.3': ['ideate', 'trust'], '1.4': ['ideate'], '1.5': ['lifecycle'], '1.6': ['ideate'], '1.7': ['lifecycle', 'reports'],
    '2.1': ['discover'], '2.3': ['ideate'], '2.4': ['ideate'], '2.6': ['patterns'], '2.7': ['lifecycle'], '2.8': ['patterns'], '2.9': ['lifecycle'],
    '3.1': ['patterns'], '3.2': ['nfr', 'trust'], '3.3': ['nfr', 'patterns'], '3.4': ['nfr'], '3.5': ['reports'], '3.6': ['patterns', 'trust'], '3.7': ['reports'],
    '4.4': ['nfr'], '4.5': ['trust'], '4.6': ['nfr'], '4.7': ['nfr', 'trust']
  };
  return map[stageId] ?? (phase === '4' ? ['trust'] : ['lifecycle']);
}

/** Studio page where the inputs a control depends on are entered. */
export function pageForControl(id: string): Page {
  if (['GOV-01', 'GOV-02', 'GOV-03', 'GOV-07'].includes(id)) return 'ideate';
  if (id.startsWith('SEC-') || id === 'REL-01' || id === 'REL-02' || id === 'REL-03' || id === 'EVAL-01') return 'patterns';
  if (['REL-04', 'OPS-04', 'OPS-06'].includes(id)) return 'nfr';
  return 'lifecycle';
}
