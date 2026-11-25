# Build and verification status

Last run: 25 November 2026, Windows 11, Node 25.8.1, Vite 6, Svelte 5, TypeScript 5.

| Check | Result |
|---|---|
| `npm run test:logic` | 72 passed, 0 failed |
| `npm run docs:check` | Generated docs up to date |
| `npx tsc -p tsconfig.logic.json` | No errors |
| `npm run check` (svelte-check) | 0 errors, 0 warnings |
| `npm run build` | Succeeds |
| `npm run test:e2e` (Playwright, Chromium headless shell) | 12 passed |

Not covered by automated tests: drag-and-drop on the canvas, printing the HTML report, and a live (non-mocked) GitHub fetch.
