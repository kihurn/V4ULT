# V4ULT

A React/TypeScript personal information SPA with Tasks, Notes, and a flexible Library, designed for mobile Safari and served by PocketBase. Includes a glass interface, keyboard-accessible dialogs, password login, paginated lists, task status updates, and note creation/detail views.

## Develop

Requires Node 22+ and an existing PocketBase backend.

```sh
npm ci
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:8090`. Set `PB_DEV_URL` when starting Vite to use another backend. Production uses `new PocketBase('/')` and same-origin API requests.

For a fresh empty project, the equivalent initialization commands are:

```sh
npm create vite@latest v4ult -- --template react-ts
cd v4ult
npm install
npm install pocketbase lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

This repository already includes the Vite/Tailwind configuration and full source. `src/App.tsx` composes login, dashboard and creation forms; `src/lib` owns the shared SDK and record helpers; `src/components/Dialog.tsx` handles modal focus.

## PocketBase prerequisites

- Password authentication enabled on the `users` auth collection (change `AUTH_COLLECTION` in `src/lib/pocketbase.ts` if needed).
- `tasks`: `title` text, `status` single select (`todo`, `doing`, `done`), `due_date` optional date.
- `notes`: `title` text, `content` text or HTML, `tags` text (comma-separated for display).
- Existing account to sign in. No signup or superuser credentials in the browser.
- Set appropriate collection list/view/create/update rules in PocketBase. The client does not enforce ownership. If the backend requires an owner relation, adapt creation payloads to the actual schema before use. Do not use broad authenticated-user rules for a multi-user private-data deployment.

Due dates represent calendar days: saved at midnight UTC, displayed from their date component without a timezone shift. Note HTML is converted to plain text and rendered through React; there is no rich HTML editor/rendering in this version.

## Verify

```sh
npm test
npm run build
npm run dev
npm run test:e2e
```

Browser tests mock the PocketBase API and cover login, refresh, task creation/status/failure handling, note creation/safe HTML rendering, logout, and responsive login layouts. Playwright config uses `/usr/bin/chromium` in this cloud workspace; change executablePath or install Playwright Chromium on another machine. Mock tests do not validate your backend schema, access rules, or credentials. Physical iPhone Safari testing is still recommended.

## Deploy

```sh
npm run build
# Set this to the directory beside your PocketBase executable:
mkdir -p /path/to/pb_public
cp -R dist/. /path/to/pb_public/
```

Copy the **contents** of dist, including index.html and assets, into pb_public. Preserve pb_data and PocketBase configuration. The UI uses tabs at `/`, so no client-side deep-route fallback is required.

The background uses softly lit charcoal surfaces and subtle grain. Compact Ferro-inspired glass widgets, recessed controls and dot-matrix SVG headings adapt to mobile screens. Widget loading entrances and progress bars respect reduced motion. No background image request is needed. Inter loads from Google Fonts with a system-font fallback. Design skills from https://github.com/emilkowalski/skills are installed in .agents/skills; the pinned revision is recorded in .agents/skills/EMIL-SOURCE.md.

## Library and AI assistant foundation

Library stores personal facts, upcoming events, checklists, links, and other information in the new owner-scoped `items` collection. Supports search, type filters, labeled details, creation, editing, and confirmed deletion. Existing Tasks and Notes stay compatible.

**Before using Library on your server**, follow [the PocketBase setup and assistant API guide](docs/POCKETBASE-LIBRARY.md). The included migration was validated on an isolated PocketBase 0.40.6 instance, including cross-user access denial. No live backend was changed. Your model can read this data through a server-side connector; AI chat, file uploads, and reminder delivery are not implemented.

## Build identity

Current release: **1.2.0**, Ferro-inspired graphite widgets, dot-matrix headings, and off-white controls. After replacing pb_public contents from dist, open `/version.json` on the same PocketBase host. It must show `1.2.0` and `ferro-graphite-dot-matrix`; use a hard refresh if the old gradient UI persists. Copy both bundled migration files into the server pb_migrations folder and run migrate up after backup if collections are missing.

## Overview and connection metrics

Overview is the landing tab. Real PocketBase counts power the Tasks, Notes, Library and task-balance widgets. Upcoming events come from Library, filtered to future starts_at and ordered by date. Refresh reloads these totals; unavailable collections show an explicit setup message rather than zero data.

Three connection widgets observe the SDK's actual fetch requests:

- API response time: average and peak elapsed milliseconds until response headers arrive, including network time.
- Request activity: completed requests in the last 60 seconds from this browser tab, not server-wide QPS/TPS.
- Request error rate: HTTP non-success responses and network failures divided by observed requests. Aborted requests are excluded. Rejected user inputs can count as HTTP errors, so this is not a database-engine error counter.

Measurements are kept in memory, capped at the latest 1,000 samples, reset on auth-store changes and reload, and record only duration/time/failure flags. No URLs, payloads, tokens or personal content are stored. In-flight samples from an old session are discarded. Development StrictMode may issue additional requests; measurements count what actually happened. Zero samples show unknown latency/error rate, rather than fabricated values. Request activity refreshes every five seconds while Overview is mounted. No extra polling requests are generated for metrics.

CPU/RAM/disk metrics, database-only query execution time, availability history and replication are not exposed by this frontend. They require server instrumentation and an authenticated monitoring API. No random/demo health numbers are presented as live backend data.

## Brand assets (1.2.2)

Place the original files in `public/background.png`, `public/favicon.png`, and `public/logo-transparent.png` before running `npm run build`. Vite copies these files directly to `dist/`. Keep the names unchanged. The transparent logo appears in both login and dashboard headers; the background covers every page; the square artwork supplies the browser favicon and Apple touch icon. The app retains its graphite controls and glass navigation.

These three images reside on the user's Windows PC and were not available as downloadable files to the cloud executor. They must be added locally; the archive contains the integration code, not the original images.
