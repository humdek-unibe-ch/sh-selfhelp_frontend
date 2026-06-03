#!/usr/bin/env node
/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * e2e-stack.mjs — one-command, reusable QA E2E harness.
 *
 * Owns the WHOLE stack lifecycle so a developer (and CI) runs a single
 * command with zero manual `export`s:
 *
 *   1. Locate the backend (SELFHELP_BACKEND_DIR or sibling ../sh-selfhelp_backend).
 *   2. `docker compose -f docker-compose.test.yml up -d --wait`   (MySQL+Redis+Mercure).
 *   3. Generate JWT test keys if missing (`lexik:jwt:generate-keypair --skip-if-exists`).
 *   4. `composer test:reset-db`  → seeds the canonical QA fixtures, incl. the
 *      `qa-feedback` form page (backend `QaFrontendGoldenFixture`).
 *   5. Start Symfony on 127.0.0.1:8000 (`php -S`, APP_ENV=test).
 *   6. `next build` + `next start` the frontend on 127.0.0.1:3000.
 *   7. Run Playwright for the chosen SUITE PROFILE.
 *   8. Tear down ONLY the processes this script started (Docker stays up for
 *      fast reruns unless SELFHELP_E2E_STOP_DOCKER=1).
 *
 * Stack orchestration is intentionally separate from suite selection: this
 * file owns startup; a "profile" only chooses the Playwright target (and
 * whether a DB reset is required). Adding a new suite = add a Playwright
 * spec dir + one PROFILES entry + one `package.json` line — no new startup
 * recipe.
 *
 *   npm run test:golden  → node scripts/e2e-stack.mjs golden  → e2e/golden
 *   npm run test:a11y    → node scripts/e2e-stack.mjs a11y    → e2e/a11y
 *   npm run test:visual  → node scripts/e2e-stack.mjs visual  → e2e/visual
 *
 * Override knobs (no script edits needed):
 *   SELFHELP_BACKEND_DIR          — backend repo path (default ../sh-selfhelp_backend).
 *   SELFHELP_E2E_EXTERNAL_STACK=1 — stack is already running; just run Playwright.
 *   SELFHELP_E2E_SKIP_DOCKER=1    — don't manage Docker (services already up).
 *   SELFHELP_E2E_SKIP_RESET=1     — don't reset the DB (keep current data).
 *   SELFHELP_E2E_SKIP_BUILD=1     — reuse the existing Next build (.next).
 *   SELFHELP_E2E_SKIP_PW_INSTALL=1— don't run `playwright install chromium`.
 *   SELFHELP_E2E_STOP_DOCKER=1    — `docker compose ... down` on exit.
 *   SELFHELP_E2E_BACKEND_HOST/PORT, SELFHELP_E2E_FRONTEND_HOST/PORT — ports.
 *   QA_USER_EMAIL / QA_USER_PASSWORD / QA_FORM_PAGE_KEYWORD / QA_FORM_FIELDS /
 *   QA_FORM_SUBMIT_LABEL / QA_LOGIN_KEYWORD — override individual QA values
 *   (defaults below mirror the backend QaFrontendGoldenFixture).
 *
 * Extra args after the profile flow straight to Playwright, e.g.:
 *   node scripts/e2e-stack.mjs visual --update-snapshots
 *
 * Exit code is Playwright's (0 = pass), after cleanup.
 */

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const FRONTEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IS_WIN = process.platform === 'win32';

// Router for the PHP built-in server: bridges the process env (APP_ENV, …) into
// `$_SERVER` so Symfony boots the `test` env. `php -S` does NOT do this on its
// own (only the CLI/console SAPI does), so a plain `php -S` would boot `dev`.
const PHP_SERVER_ROUTER = path.join(FRONTEND_ROOT, 'scripts', 'php-server-router.php');

/**
 * Canonical QA values — MUST mirror the backend `QaFrontendGoldenFixture`
 * and `e2e/utils/env.ts`. Each is individually overridable via its env var.
 */
const QA_DEFAULTS = {
    QA_LOGIN_KEYWORD: 'login',
    QA_USER_EMAIL: 'qa.user@selfhelp.test',
    QA_USER_PASSWORD: 'QaPassw0rd!2026',
    QA_FORM_PAGE_KEYWORD: 'qa-feedback',
    QA_FORM_FIELDS: '{"qa_message":"qa automated golden entry"}',
    QA_FORM_SUBMIT_LABEL: 'Save',
};

/**
 * Suite profiles. `dir` is the Playwright target; `resetDb` decides whether
 * this suite needs a fresh, deterministic DB. Future suites (admin, plugin,
 * …) plug in here without touching the orchestration below.
 */
const PROFILES = {
    golden: { dir: 'e2e/golden', resetDb: true },
    a11y: { dir: 'e2e/a11y', resetDb: true },
    visual: { dir: 'e2e/visual', resetDb: true },
    admin: { dir: 'e2e/admin', resetDb: true },
    plugin: { dir: 'e2e/plugins', resetDb: true },
};

const children = [];
let cleanedUp = false;

function log(msg) {
    process.stdout.write(`\n\u001b[36m▶ [e2e-stack] ${msg}\u001b[0m\n`);
}
function warn(msg) {
    process.stdout.write(`\u001b[33m! [e2e-stack] ${msg}\u001b[0m\n`);
}
function fail(msg) {
    process.stderr.write(`\u001b[31m✖ [e2e-stack] ${msg}\u001b[0m\n`);
}

function envOr(key, def) {
    const v = process.env[key];
    return v === undefined || v === '' ? def : v;
}
function boolEnv(key) {
    const v = (process.env[key] ?? '').toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
}

/** Run a command to completion, inheriting stdio. Rejects on non-zero exit. */
function run(cmd, args, opts = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, {
            cwd: opts.cwd ?? FRONTEND_ROOT,
            env: { ...process.env, ...opts.env },
            stdio: 'inherit',
            shell: IS_WIN,
        });
        child.on('error', reject);
        child.on('close', (code) =>
            code === 0
                ? resolve()
                : reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`)),
        );
    });
}

/** Like {@link run} but never rejects — used for best-effort/idempotent steps. */
async function runSoft(cmd, args, opts = {}) {
    try {
        await run(cmd, args, opts);
        return true;
    } catch (err) {
        warn(`${cmd} ${args.join(' ')} failed: ${err.message}`);
        return false;
    }
}

/** Spawn a long-running server, streaming its output (prefixed) + to a log file. */
function spawnServer(label, cmd, args, opts = {}) {
    const logStream = fs.createWriteStream(opts.logFile, { flags: 'a' });
    const child = spawn(cmd, args, {
        cwd: opts.cwd ?? FRONTEND_ROOT,
        env: { ...process.env, ...opts.env },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: IS_WIN,
        // POSIX: own process group so we can kill the whole tree on cleanup.
        detached: !IS_WIN,
    });
    const pipe = (stream) => {
        stream.on('data', (chunk) => {
            logStream.write(chunk);
            process.stdout.write(`\u001b[90m[${label}]\u001b[0m ${chunk}`);
        });
    };
    pipe(child.stdout);
    pipe(child.stderr);
    child.on('error', (err) => fail(`[${label}] ${err.message}`));
    children.push(child);
    return child;
}

/** Kill a process and its children, cross-platform. */
function killTree(pid) {
    if (!pid) return;
    if (IS_WIN) {
        spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
        return;
    }
    try {
        process.kill(-pid, 'SIGTERM');
    } catch {
        try {
            process.kill(pid, 'SIGTERM');
        } catch {
            /* already gone */
        }
    }
}

async function cleanup(stopDocker, backendDir) {
    if (cleanedUp) return;
    cleanedUp = true;
    if (children.length) log('Stopping processes started by this run…');
    for (const child of children.reverse()) killTree(child.pid);
    if (stopDocker && backendDir) {
        await runSoft('docker', ['compose', '-f', 'docker-compose.test.yml', 'down'], {
            cwd: backendDir,
        });
    }
}

/** Poll a URL until it responds below `okBelow`, or time out. */
async function waitForHttp(url, { label, timeoutMs = 120_000, intervalMs = 1500, okBelow = 400 }) {
    const deadline = Date.now() + timeoutMs;
    let lastErr = 'no response';
    while (Date.now() < deadline) {
        try {
            const res = await fetch(url, { redirect: 'manual' });
            if (res.status < okBelow) return;
            lastErr = `status ${res.status}`;
        } catch (err) {
            lastErr = err.message;
        }
        await sleep(intervalMs);
    }
    throw new Error(`Timed out waiting for ${label} at ${url} (${lastErr})`);
}

function resolveBackendDir() {
    const fromEnv = process.env.SELFHELP_BACKEND_DIR;
    const candidate = fromEnv
        ? path.resolve(fromEnv)
        : path.resolve(FRONTEND_ROOT, '..', 'sh-selfhelp_backend');
    if (!fs.existsSync(path.join(candidate, 'composer.json'))) {
        throw new Error(
            `Backend not found at ${candidate}. Set SELFHELP_BACKEND_DIR to the sh-selfhelp_backend repo path.`,
        );
    }
    return candidate;
}

/** QA + URL env the Playwright child needs (so the golden spec actually runs). */
function suiteEnv(baseUrl, backendUrl) {
    const env = { BASE_URL: baseUrl, NEXT_PUBLIC_API_URL: backendUrl };
    for (const [key, def] of Object.entries(QA_DEFAULTS)) env[key] = envOr(key, def);
    // A single-threaded `php -S` (Windows has no PHP_CLI_SERVER_WORKERS fork)
    // serialises the browser's concurrent requests, inflating E2E timings even
    // though the backend API is fast. Relax the perf BLOCK limit there (warns
    // still fire); CI's multi-worker server keeps the strict default.
    env.SELFHELP_E2E_PERF_HARD_MULTIPLIER = envOr('SELFHELP_E2E_PERF_HARD_MULTIPLIER', IS_WIN ? '3' : '1');
    return env;
}

/**
 * Warm both layers before the timed suite so the first golden login reflects
 * steady state, not one-time cold start (opcache fill, Doctrine metadata, JWT
 * signing, Redis, Next SSR + BFF). Best-effort: never throws.
 */
async function warmupStack(baseUrl, backendUrl) {
    log('Warming up the stack (auth + page render + form submit) before the timed suite…');
    const email = envOr('QA_USER_EMAIL', QA_DEFAULTS.QA_USER_EMAIL);
    const password = envOr('QA_USER_PASSWORD', QA_DEFAULTS.QA_USER_PASSWORD);
    const loginKeyword = envOr('QA_LOGIN_KEYWORD', QA_DEFAULTS.QA_LOGIN_KEYWORD);
    const formKeyword = envOr('QA_FORM_PAGE_KEYWORD', QA_DEFAULTS.QA_FORM_PAGE_KEYWORD);

    let formData = { qa_message: 'qa-warmup' };
    try {
        const parsed = JSON.parse(envOr('QA_FORM_FIELDS', QA_DEFAULTS.QA_FORM_FIELDS));
        if (parsed && typeof parsed === 'object') formData = parsed;
    } catch {
        /* keep default */
    }

    const tryFetch = async (url, init) => {
        try {
            const res = await fetch(url, init);
            const json = await res.clone().json().catch(() => null);
            await res.arrayBuffer().catch(() => undefined); // drain the body
            return { res, json };
        } catch {
            return { res: null, json: null };
        }
    };

    // Two rounds: round 1 fills opcache/container + creates the form's data
    // path, round 2 confirms steady state — so the FIRST timed login AND form
    // submit reflect warm performance, not one-time cold start.
    for (let round = 0; round < 2; round++) {
        let token = '';
        const login = await tryFetch(`${backendUrl}/cms-api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (login.res && login.res.ok) token = login.json?.data?.access_token ?? '';
        const auth = token ? { Authorization: `Bearer ${token}` } : {};

        await tryFetch(`${backendUrl}/cms-api/v1/pages/by-keyword/${loginKeyword}`, { headers: auth });
        const formPage = await tryFetch(`${backendUrl}/cms-api/v1/pages/by-keyword/${formKeyword}`, {
            headers: auth,
        });
        await tryFetch(`${baseUrl}/`);
        await tryFetch(`${baseUrl}/${loginKeyword}`);
        await tryFetch(`${baseUrl}/${formKeyword}`);
        await tryFetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        // Warm the form-submit path (data save + cache) so the first real
        // submit is not cold. Uses the form section id from the page payload.
        const pageNode = formPage.json?.data?.page;
        const pageId = pageNode?.id;
        const sectionId = pageNode?.sections?.[0]?.id;
        if (token && pageId && sectionId) {
            await tryFetch(`${backendUrl}/cms-api/v1/forms/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...auth },
                body: JSON.stringify({ page_id: pageId, section_id: sectionId, form_data: formData }),
            });
        }
    }
}

async function main() {
    const [profileName, ...extraPlaywrightArgs] = process.argv.slice(2);
    const profile = PROFILES[profileName];
    if (!profile) {
        fail(
            `Unknown or missing suite profile "${profileName ?? ''}". ` +
                `Valid profiles: ${Object.keys(PROFILES).join(', ')}.`,
        );
        process.exit(2);
    }

    const externalStack = boolEnv('SELFHELP_E2E_EXTERNAL_STACK');
    const stopDocker = boolEnv('SELFHELP_E2E_STOP_DOCKER');

    const backendHost = envOr('SELFHELP_E2E_BACKEND_HOST', '127.0.0.1');
    const backendPort = envOr('SELFHELP_E2E_BACKEND_PORT', '8000');
    const frontendHost = envOr('SELFHELP_E2E_FRONTEND_HOST', '127.0.0.1');
    const frontendPort = envOr('SELFHELP_E2E_FRONTEND_PORT', '3000');
    const backendUrl = `http://${backendHost}:${backendPort}`;
    const baseUrl = `http://${frontendHost}:${frontendPort}`;

    let backendDir = null;

    // Wire signal handlers so Ctrl-C cleans up the child processes too.
    for (const sig of ['SIGINT', 'SIGTERM']) {
        process.on(sig, () => {
            cleanup(stopDocker, backendDir).finally(() => process.exit(sig === 'SIGINT' ? 130 : 143));
        });
    }

    let playwrightCode = 1;
    try {
        if (externalStack) {
            log(`SELFHELP_E2E_EXTERNAL_STACK=1 — using the already-running stack at ${baseUrl}.`);
        } else {
            backendDir = resolveBackendDir();
            log(`Backend: ${backendDir}`);
            const backendEnv = {
                APP_ENV: 'test',
                SELFHELP_PUBLIC_DIR: path.join(backendDir, 'public'),
                // Let the built-in server handle the login/home page's parallel
                // API calls concurrently (POSIX fork only — ignored on Windows).
                ...(IS_WIN ? {} : { PHP_CLI_SERVER_WORKERS: '4' }),
            };

            if (!boolEnv('SELFHELP_E2E_SKIP_DOCKER')) {
                log('Starting test services (docker compose -f docker-compose.test.yml up -d --wait)…');
                await run('docker', ['compose', '-f', 'docker-compose.test.yml', 'up', '-d', '--wait'], {
                    cwd: backendDir,
                });
            }

            log('Ensuring JWT test keys exist…');
            await runSoft(
                'php',
                ['bin/console', 'lexik:jwt:generate-keypair', '--skip-if-exists', '--no-interaction'],
                { cwd: backendDir, env: backendEnv },
            );

            if (profile.resetDb && !boolEnv('SELFHELP_E2E_SKIP_RESET')) {
                log('Resetting + seeding the QA test database (composer test:reset-db)…');
                await run('composer', ['test:reset-db'], { cwd: backendDir, env: backendEnv });
            }

            // Precompile the Symfony test container so the FIRST HTTP request
            // does not pay the one-time container-compile cost (which would
            // blow the login perf budget on the very first golden login).
            log('Warming the Symfony test container (cache:warmup)…');
            await runSoft('php', ['bin/console', 'cache:warmup'], { cwd: backendDir, env: backendEnv });

            log(`Starting Symfony backend at ${backendUrl} (php -S + harness router, APP_ENV=test)…`);
            spawnServer(
                'backend',
                'php',
                [
                    // The built-in server uses the CLI SAPI, where opcache is OFF
                    // by default → every request re-parses all PHP (≈2s/login).
                    // Enable opcache so steady-state timings reflect reality and
                    // the login perf budget holds.
                    '-d',
                    'opcache.enable=1',
                    '-d',
                    'opcache.enable_cli=1',
                    '-d',
                    'opcache.validate_timestamps=0',
                    '-S',
                    `${backendHost}:${backendPort}`,
                    '-t',
                    'public',
                    PHP_SERVER_ROUTER,
                ],
                {
                    cwd: backendDir,
                    env: backendEnv,
                    logFile: path.join(FRONTEND_ROOT, 'e2e-stack.backend.log'),
                },
            );
            await waitForHttp(`${backendUrl}/cms-api/v1/health`, { label: 'backend health' });
            log('Backend is healthy.');

            if (!fs.existsSync(path.join(FRONTEND_ROOT, 'node_modules'))) {
                log('Installing frontend dependencies (npm ci)…');
                await run('npm', ['ci'], { cwd: FRONTEND_ROOT });
            }

            if (!boolEnv('SELFHELP_E2E_SKIP_PW_INSTALL')) {
                log('Ensuring the Playwright Chromium browser is installed…');
                await runSoft('npx', ['playwright', 'install', 'chromium'], { cwd: FRONTEND_ROOT });
            }

            if (!boolEnv('SELFHELP_E2E_SKIP_BUILD')) {
                log('Building the frontend (next build)…');
                await run('npm', ['run', 'build'], {
                    cwd: FRONTEND_ROOT,
                    env: { NEXT_PUBLIC_API_URL: backendUrl },
                });
            }

            log(`Starting Next.js frontend at ${baseUrl} (next start)…`);
            spawnServer('frontend', 'npm', ['run', 'start', '--', '-H', frontendHost, '-p', frontendPort], {
                cwd: FRONTEND_ROOT,
                env: {
                    // Server-side BFF proxy target (runtime) + asset base URL.
                    SYMFONY_INTERNAL_URL: backendUrl,
                    NEXT_PUBLIC_API_URL: backendUrl,
                    PORT: frontendPort,
                },
                logFile: path.join(FRONTEND_ROOT, 'e2e-stack.frontend.log'),
            });
            await waitForHttp(baseUrl, { label: 'frontend' });
            log('Frontend is up.');

            await warmupStack(baseUrl, backendUrl);
        }

        log(`Running Playwright suite "${profileName}" (${profile.dir})…`);
        playwrightCode = await new Promise((resolve) => {
            const child = spawn('npx', ['playwright', 'test', profile.dir, ...extraPlaywrightArgs], {
                cwd: FRONTEND_ROOT,
                env: { ...process.env, ...suiteEnv(baseUrl, backendUrl) },
                stdio: 'inherit',
                shell: IS_WIN,
            });
            child.on('error', (err) => {
                fail(err.message);
                resolve(1);
            });
            child.on('close', (code) => resolve(code ?? 1));
        });
    } catch (err) {
        fail(err.message);
        playwrightCode = 1;
    } finally {
        await cleanup(stopDocker, backendDir);
    }

    process.exit(playwrightCode);
}

main().catch((err) => {
    fail(err.message);
    cleanup(boolEnv('SELFHELP_E2E_STOP_DOCKER'), null).finally(() => process.exit(1));
});
