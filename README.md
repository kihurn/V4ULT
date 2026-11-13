# V4ULT

A React/TypeScript personal Tasks and Notes SPA, designed for mobile Safari and served by PocketBase. Includes a glass interface, keyboard-accessible dialogs, password login, paginated lists, task status updates, and note creation/detail views.

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

The exact reference portraits load from assets.uberdesigner.ai and Inter from Google Fonts. If blocked or offline, the navy background and system font remain usable. Portrait URLs were preserved from the supplied style prompt; this environment currently blocks that host with HTTP 403.
