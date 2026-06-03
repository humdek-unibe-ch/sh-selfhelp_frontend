/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# SelfHelp Frontend

React frontend for SelfHelp based on [MaterialPro NextJs template](https://www.wrappixel.com/templates/materialpro-nextjs-admin-dashboard-app-directory/).

## License

Licensed under the [Mozilla Public License 2.0](LICENSE). Copyright (c) 2026 Humdek, University of Bern.

### SPDX headers

Every TS/TSX/JS file should carry a two-line SPDX header:

```ts
/*
 * SPDX-FileCopyrightText: 2026 Humdek, University of Bern
 * SPDX-License-Identifier: MPL-2.0
 */
```

The header text lives in [`header.txt`](header.txt). Header insertion / verification / removal is automated with [`license-check-and-add`](https://www.npmjs.com/package/license-check-and-add) using [`license-check-and-add-config.json`](license-check-and-add-config.json).

```bash
# One-time install (already in devDependencies):
npm install

# Add the header to every .ts/.tsx/.js/.jsx/.mjs/.cjs file
# under src/ (excluding node_modules, .next, public/, build/).
npm run headers:add

# Verify (CI-friendly: exits 1 if any file is missing the header).
npm run headers:check

# Strip the header (rarely needed; e.g. before re-licensing).
npm run headers:remove
```

The tool also reads `.gitignore` so build/cache directories are auto-excluded. Extra exclusions live in the `exact_paths` section of the config.

## End-to-end testing (Playwright)

E2E specs live under `e2e/` (`e2e/golden`, `e2e/a11y`, `e2e/visual`, …) and run
against a **real running stack**: this frontend + the Symfony backend + a
throwaway MySQL/Redis/Mercure. A reusable harness, `scripts/e2e-stack.mjs`,
makes each suite a **one-command, zero-manual-export** workflow:

```bash
# From the frontend repo — that's the whole setup.
npm run test:golden     # → e2e/golden   (the form → action → job golden flow)
npm run test:a11y       # → e2e/a11y     (axe-core accessibility)
npm run test:visual     # → e2e/visual   (visual regression)
```

Each command runs the **same** harness against a different suite. The harness:

1. Locates the backend (`SELFHELP_BACKEND_DIR`, else the sibling `../sh-selfhelp_backend`).
2. Starts the throwaway test services: `docker compose -f docker-compose.test.yml up -d --wait`.
3. Generates JWT test keys if missing (`lexik:jwt:generate-keypair --skip-if-exists`).
4. Seeds the QA database: `composer test:reset-db`.
5. Starts Symfony on `127.0.0.1:8000` via a small router (`scripts/php-server-router.php`,
   needed because `php -S` does not expose `APP_ENV` to the app and on POSIX
   enables multi-worker concurrency) and Next on `127.0.0.1:3000`.
6. Warms the auth / page-render / form-submit paths, then runs Playwright for the chosen suite.
7. Stops **only** the processes it started (Docker stays up for fast reruns).

**No manual QA exports.** The backend `QaFrontendGoldenFixture` (seeded by
`composer test:reset-db`) owns the canonical QA data — the `qa-feedback` form
page, the `qa_message` field, and the `subject`-group ACL — and the harness
exports matching QA env defaults. The golden spec logs in as
`qa.user@selfhelp.test`, opens `/qa-feedback`, fills `qa_message`, submits, and
asserts the success alert.

### Prerequisites

- Docker (for `docker-compose.test.yml`).
- The backend repo available as a sibling (`../sh-selfhelp_backend`) or via
  `SELFHELP_BACKEND_DIR`, with its PHP deps installed (`composer install`).
- Node deps installed (`npm ci`) — the harness runs it automatically only if
  `node_modules` is missing.

`npm run test:e2e` (raw `playwright test`) still works without a stack: the
golden spec **skips cleanly** when the QA env isn't present, so it's safe on a
machine with nothing running.

### Override knobs (no script edits needed)

| Env var | Effect |
| --- | --- |
| `SELFHELP_BACKEND_DIR` | Path to the backend repo (default `../sh-selfhelp_backend`). |
| `SELFHELP_E2E_EXTERNAL_STACK=1` | Stack is already running — skip all orchestration, just run Playwright against `BASE_URL`. |
| `SELFHELP_E2E_SKIP_DOCKER=1` | Don't manage Docker (services already up). |
| `SELFHELP_E2E_SKIP_RESET=1` | Don't reset/seed the DB (keep current data). |
| `SELFHELP_E2E_SKIP_BUILD=1` | Reuse the existing `.next` build. |
| `SELFHELP_E2E_SKIP_PW_INSTALL=1` | Don't run `playwright install chromium`. |
| `SELFHELP_E2E_STOP_DOCKER=1` | `docker compose … down` on exit. |
| `SELFHELP_E2E_BACKEND_HOST` / `SELFHELP_E2E_BACKEND_PORT` | Backend bind/host (default `127.0.0.1:8000`). |
| `SELFHELP_E2E_FRONTEND_HOST` / `SELFHELP_E2E_FRONTEND_PORT` | Frontend bind/host (default `127.0.0.1:3000`). |
| `SELFHELP_E2E_PERF_HARD_MULTIPLIER` | Scales only the perf **block** limit (not warns). The harness sets `3` on Windows (single-threaded `php -S`) and `1` elsewhere; CI keeps the strict default. |
| `QA_USER_EMAIL` / `QA_USER_PASSWORD` / `QA_FORM_PAGE_KEYWORD` / `QA_FORM_FIELDS` / `QA_FORM_SUBMIT_LABEL` / `QA_LOGIN_KEYWORD` | Override individual QA values (defaults mirror the backend fixture). |

> **Perf budgets on a local single-threaded server.** The golden spec asserts the
> canonical budgets (login < 500 ms, form submit < 1000 ms) against the **API
> round-trip**. On Windows, `php -S` is single-threaded (no `PHP_CLI_SERVER_WORKERS`
> fork), so the browser's concurrent requests serialise and inflate the
> end-to-end numbers even though the backend itself answers in ~100 ms. The
> harness therefore relaxes only the blocking limit locally (timings are still
> logged and warned); CI runs a multi-worker server and enforces the strict
> budgets, so real regressions are still gated.

### Adding a new suite

Add a Playwright spec dir (e.g. `e2e/admin/`), a one-line `PROFILES` entry in
`scripts/e2e-stack.mjs`, and a `package.json` script
(`"test:admin": "node scripts/e2e-stack.mjs admin"`). No new startup recipe —
the harness already owns the stack. `admin` and `plugin` profiles are already
wired for future suites.

### How the test database is selected (DATABASE_URL & the `_test` suffix)

The harness runs every backend command with `APP_ENV=test`, so Symfony loads the
backend's `.env.test` (+ `.env.test.local`). That file points `DATABASE_URL` at
the `docker-compose.test.yml` MySQL (host port **3307**, distinct from a local
dev MySQL on 3306), and Doctrine's `when@test` config **appends `_test`** to the
database name — so a base name of `selfhelp` becomes the **`selfhelp_test`**
database the reset command creates and seeds. You do **not** set `DATABASE_URL`
by hand locally. In CI, a real `DATABASE_URL` env var is exported at the job
level and takes precedence over `.env.test`, pointing Symfony at the GitHub
`services` MySQL instead.
