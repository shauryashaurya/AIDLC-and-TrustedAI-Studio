// Regenerates data/reference-catalog-report.md with the app's own referenceReport() (loaded through Vite).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { referenceReport } = await server.ssrLoadModule('/src/lib/reports.ts');
  writeFileSync(new URL('../data/reference-catalog-report.md', import.meta.url), referenceReport() + '\n');
  console.log('Wrote data/reference-catalog-report.md');
} finally { await server.close(); }
