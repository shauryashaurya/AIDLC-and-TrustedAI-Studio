// Regenerates the documents derived from data/ catalogs:
//   data/references.md       ← data/references.json (+ controls, stages)
//   data/aidlc-stage-guide.md ← data/aidlc-stages.json, aidlc-profiles.json, aidlc-agents.json
// Usage: npm run docs:gen            (write)
//        npm run docs:gen -- --check (exit 1 if any file is stale)
import { readFileSync, writeFileSync } from 'node:fs';
import { referencesMarkdown } from '../src/lib/references.ts';
import { stageGuideMarkdown } from '../src/lib/aidlc.ts';
const data = name => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf-8'));
const stages = data('aidlc-stages.json');
const outputs = {
  'references.md': referencesMarkdown(data('references.json'), data('trust-controls.json'), stages.stages),
  'aidlc-stage-guide.md': stageGuideMarkdown(stages, data('aidlc-profiles.json'), data('aidlc-agents.json'))
};
const check = process.argv.includes('--check');
let stale = 0;
for (const [file, md] of Object.entries(outputs)) {
  const target = new URL(`../data/${file}`, import.meta.url);
  if (check) {
    let current = ''; try { current = readFileSync(target, 'utf-8').replace(/\r\n/g, '\n'); } catch {}
    if (current !== md) { console.error(`data/${file} is stale. Run: npm run docs:gen`); stale++; }
  } else { writeFileSync(target, md); console.log(`Wrote data/${file}`); }
}
if (check && stale) process.exit(1);
if (check) console.log('Generated documents are up to date.');
