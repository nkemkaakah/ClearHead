# AGENTS.md

## Cursor Cloud specific instructions

### Overview

ClearHead is a single Next.js 15 (App Router) app — no database, Docker, or separate backend. All student-facing pages and `/api/support-plan` run from one `npm run dev` process.

### Environment variables

Copy `.env.example` to `.env.local` before running the app:

| Variable | Required for | Purpose |
|---|---|---|
| `MANUS_API_KEY` | Full support-plan flow (`/plan`) | Runtime AI via Manus API (`lib/manus/`) |
| `CURSOR_API_KEY` | Engineering only | `dev/clearhead-builder.ts` (`npm run build:step`) |

Crisis override (client + server) works **without** Manus — it uses hardcoded detection in `lib/crisis/detect.ts`.

### Commands

See `package.json` scripts:

| Task | Command |
|---|---|
| Dev server | `npm run dev` → http://localhost:3000 |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Production build | `npm run build` |

### Gotchas

- **Manus API dependency**: Non-crisis flows call `POST /api/support-plan`, which creates and polls Manus tasks. The structured output schema in `lib/manus/support-plan.ts` must include `additionalProperties: false` (Manus rejects schemas without it). `lib/manus/client.ts` polls `status_update.agent_status` (nested field) and retries `task.listMessages` on transient `not_found` (~1s after task creation). Crisis flows work without Manus.
- **No automated E2E tests**: No Playwright/Jest in the repo; verify flows manually in the browser.
- **Session state**: Support-check answers live in `sessionStorage`; clearing browser storage resets progress.
- **Crisis modal**: The crisis override overlay is intentionally hard to dismiss — this is a safety feature, not a bug.
