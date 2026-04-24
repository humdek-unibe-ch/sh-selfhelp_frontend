#!/usr/bin/env node
/**
 * Codegen: regenerate `src/types/common/styles.types.generated.ts` from the
 * live style schema endpoint (`GET /cms-api/v1/admin/styles/schema`).
 *
 * Usage:
 *   npm run gen:styles
 *
 * The script auto-derives the schema URL from the same env vars the BFF
 * proxy / Server Components already use:
 *
 *   NEXT_PUBLIC_API_URL   - base Symfony URL (default: http://localhost/symfony)
 *   SYMFONY_API_PREFIX    - API prefix      (default: /cms-api/v1)
 *
 * Override knobs (all read from `.env.local` / `.env` / `process.env`):
 *   STYLES_SCHEMA_URL       - full URL to the schema endpoint (overrides derivation)
 *   STYLES_SCHEMA_TOKEN     - admin bearer token; used as-is if set
 *   STYLES_SCHEMA_EMAIL     - admin email, used to auto-login when no token is set
 *   STYLES_SCHEMA_PASSWORD  - admin password, paired with STYLES_SCHEMA_EMAIL
 *   STYLES_SCHEMA_OUTPUT    - override output path
 *
 * See `.env.example` for a full annotated template.
 *
 * The generated file is *supplementary* to the hand-crafted
 * `styles.types`: it exposes every style name currently in the DB, every
 * allowed field (with a best-effort TS type inferred from the field's SQL
 * type), and the runtime default-value map used by the prompt-template
 * generator and other tools. The file is fully auto-generated — DO NOT EDIT.
 *
 * Run manually after any change to the `styles` / `fields` / `styles_fields`
 * tables.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

// --- Minimal .env.local loader -------------------------------------------
function loadEnvFile(filePath) {
    if (!existsSync(filePath)) return;
    const raw = readFileSync(filePath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eq = trimmed.indexOf('=');
        if (eq <= 0) return;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
    });
}

loadEnvFile(resolve(repoRoot, '.env.local'));
loadEnvFile(resolve(repoRoot, '.env'));

// Mirror the defaults from `src/config/api.config.ts` + `src/config/server.config.ts`
// so running `npm run gen:styles` against a local dev stack just works.
const DEFAULT_BACKEND_URL = 'http://localhost/symfony';
const DEFAULT_API_PREFIX = '/cms-api/v1';
const SCHEMA_ROUTE = '/admin/styles/schema';
const LOGIN_ROUTE = '/auth/login';

function stripTrailingSlash(value) {
    return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizePrefix(value) {
    const withSlash = value.startsWith('/') ? value : `/${value}`;
    return stripTrailingSlash(withSlash);
}

function resolveApiBase() {
    const base = stripTrailingSlash(
        process.env.NEXT_PUBLIC_API_URL ||
            process.env.SYMFONY_INTERNAL_URL ||
            DEFAULT_BACKEND_URL
    );
    const prefix = normalizePrefix(
        process.env.SYMFONY_API_PREFIX || DEFAULT_API_PREFIX
    );
    return `${base}${prefix}`;
}

function resolveSchemaEndpoint() {
    if (process.env.STYLES_SCHEMA_URL) return process.env.STYLES_SCHEMA_URL;
    return `${resolveApiBase()}${SCHEMA_ROUTE}`;
}

const endpoint = resolveSchemaEndpoint();
const outputPath =
    process.env.STYLES_SCHEMA_OUTPUT ||
    resolve(repoRoot, 'src/types/common/styles.types.generated.ts');

async function acquireToken() {
    const pasted = process.env.STYLES_SCHEMA_TOKEN?.trim();
    if (pasted) return { token: pasted, source: 'STYLES_SCHEMA_TOKEN' };

    const email = process.env.STYLES_SCHEMA_EMAIL?.trim();
    const password = process.env.STYLES_SCHEMA_PASSWORD;
    if (!email || !password) return { token: null, source: 'none' };

    const loginUrl = `${resolveApiBase()}${LOGIN_ROUTE}`;
    console.log(`[gen:styles] Logging in as ${email} via ${loginUrl}`);
    const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    const loginBody = await loginRes.json().catch(() => null);
    if (!loginRes.ok || !loginBody?.data?.access_token) {
        console.error(
            `[gen:styles] Auto-login failed: HTTP ${loginRes.status} ${loginRes.statusText}`
        );
        console.error(
            JSON.stringify(loginBody ?? { message: 'no JSON body' }).slice(0, 500)
        );
        console.error(
            '\n  Check STYLES_SCHEMA_EMAIL / STYLES_SCHEMA_PASSWORD in .env.local, or\n' +
                '  set STYLES_SCHEMA_TOKEN=<admin JWT> directly.'
        );
        process.exit(1);
    }
    return { token: loginBody.data.access_token, source: 'auto-login' };
}

console.log(`[gen:styles] Fetching schema from ${endpoint}`);
const { token, source } = await acquireToken();
if (!token) {
    console.log(
        '[gen:styles] No STYLES_SCHEMA_TOKEN / credentials set — the request will be sent unauthenticated.\n' +
            '             If the endpoint rejects it with 401/403, pick ONE option:\n' +
            '               a) paste a JWT:       STYLES_SCHEMA_TOKEN=eyJhbGciOi... npm run gen:styles\n' +
            '               b) auto-login (dev):  set STYLES_SCHEMA_EMAIL + STYLES_SCHEMA_PASSWORD in .env.local\n' +
            '             See .env.example for a ready-to-edit template.'
    );
} else {
    console.log(`[gen:styles] Using admin token (source: ${source}).`);
}

// --- Fetch schema --------------------------------------------------------
const headers = { Accept: 'application/json' };
if (token) headers.Authorization = `Bearer ${token}`;

const response = await fetch(endpoint, { headers });
if (!response.ok) {
    console.error(
        `[gen:styles] Schema fetch failed: HTTP ${response.status} ${response.statusText}`
    );
    const body = await response.text();
    console.error(body.slice(0, 1000));
    if (response.status === 401 || response.status === 403) {
        console.error(
            '\n  Tip: copy .env.example to .env.local and either\n' +
                '    - set STYLES_SCHEMA_TOKEN to an admin JWT, or\n' +
                '    - set STYLES_SCHEMA_EMAIL and STYLES_SCHEMA_PASSWORD to let the script log in.'
        );
    }
    process.exit(1);
}

const payload = await response.json();
const schema = payload?.data ?? payload;
if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    console.error(
        '[gen:styles] Unexpected schema shape — expected a plain object keyed by style name.'
    );
    console.error(JSON.stringify(schema).slice(0, 500));
    process.exit(1);
}

// --- Field-type → TypeScript annotation mapping --------------------------
// Kept intentionally small. Unknown types fall back to `string`. Richer
// per-field literal types continue to live in the hand-crafted
// `styles.types` and can reference entries in this generated file.
const fieldTypeToTs = {
    text: 'string',
    textarea: 'string',
    markdown: 'string',
    'markdown-inline': 'string',
    'rich-text-editor': 'string',
    'code-editor': 'string',
    json: 'string',
    url: 'string',
    'img-src': 'string',
    img: 'string',
    video: 'string',
    audio: 'string',
    color: 'string',
    'color-picker': 'string',
    select: 'string',
    'select-css': 'string',
    'select-language': 'string',
    'select-group': 'string',
    'select-style': 'string',
    'select-pageKeyword': 'string',
    'select-page-keyword': 'string',
    'select-user-group': 'string',
    'select-sectionName': 'string',
    'select-record': 'string',
    'select-icon': 'string',
    'select-tailwindcss-class': 'string',
    segment: 'string',
    checkbox: `'0' | '1'`,
    switch: `'0' | '1'`,
    'checkbox-value': `'0' | '1'`,
    slider: 'string',
    number: 'string',
    'number-input': 'string',
    condition: 'string',
    data_config: 'string',
    action_options: 'string',
};

// --- Identifier helpers --------------------------------------------------
function toPascalCase(name) {
    return name
        .split(/[-_]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

function tsStringLiteral(value) {
    if (value === null || value === undefined) return 'null';
    return JSON.stringify(String(value));
}

// --- Render output -------------------------------------------------------
const styleNames = Object.keys(schema).sort();

const banner = [
    '/* eslint-disable */',
    '/**',
    ' * THIS FILE IS AUTO-GENERATED.',
    ' *',
    ` * Source:    ${endpoint}`,
    ` * Generated: ${new Date().toISOString()}`,
    ' *',
    ' * DO NOT EDIT MANUALLY — regenerate with `npm run gen:styles`.',
    ' */',
    '',
    '// Keep these aligned with the generated per-style field type unions.',
    "import type { IContentField } from './styles.types';",
    '',
].join('\n');

const styleNameUnion =
    styleNames.length > 0
        ? styleNames.map((n) => tsStringLiteral(n)).join('\n    | ')
        : 'string';

const lines = [];
lines.push(banner);

lines.push(`export type TStyleNameFromDb =\n    | ${styleNameUnion};\n`);

lines.push(
    'export interface IStyleFieldOption {',
    '    /** Canonical value that MUST be written into the JSON payload. */',
    '    value: string;',
    '    /** Human-readable label shown in the admin UI. */',
    '    text: string;',
    '}',
    '',
    'export interface IStyleFieldSchemaMeta {',
    "    /** SQL field type (e.g. 'text', 'checkbox', 'slider', 'select-css'). */",
    '    type: string;',
    '    /** 1 = translatable / user-facing (real locale), 0 = property (locale "all"). */',
    '    display: 0 | 1;',
    '    /** DB default value (may be null). */',
    '    default_value: string | null;',
    '    help?: string | null;',
    '    title?: string | null;',
    '    hidden?: 0 | 1;',
    '    /** Placeholder hint from fields.config (free-form fields). */',
    '    placeholder?: string | null;',
    '    /** Valid enum choices. Empty array means the field is free-form. */',
    '    options?: IStyleFieldOption[];',
    '}',
    '',
    'export interface IStyleSchemaEntry {',
    '    id: number;',
    '    group: string;',
    '    can_have_children: boolean;',
    '    description?: string | null;',
    '    fields: Record<string, IStyleFieldSchemaMeta>;',
    '    allowed_children: string[];',
    '    allowed_parents: string[];',
    '}',
    '',
    'export type IStyleSchemaMap = Record<TStyleNameFromDb, IStyleSchemaEntry>;',
    ''
);

function sanitizeOptionValues(options) {
    if (!Array.isArray(options) || options.length === 0) return [];
    const seen = new Set();
    const out = [];
    for (const opt of options) {
        if (!opt || typeof opt !== 'object') continue;
        const raw = opt.value;
        if (raw === undefined || raw === null) continue;
        const value = String(raw);
        if (value === '' || seen.has(value)) continue;
        seen.add(value);
        out.push(value);
    }
    return out;
}

function optionUnionOrFallback(optionValues, fallback) {
    if (optionValues.length === 0) return fallback;
    return optionValues.map((v) => tsStringLiteral(v)).join(' | ');
}

const perStyleInterfaces = [];
for (const styleName of styleNames) {
    const entry = schema[styleName];
    const fields = entry?.fields ?? {};
    const ifaceName = `I${toPascalCase(styleName)}Fields`;
    const fieldLines = Object.keys(fields)
        .sort()
        .map((fieldName) => {
            const meta = fields[fieldName] ?? {};
            const fallbackType = fieldTypeToTs[meta.type] ?? 'string';
            const optionValues = sanitizeOptionValues(meta.options);
            const type = optionUnionOrFallback(optionValues, fallbackType);
            const doc = [
                meta.type ? `@type ${meta.type}` : null,
                meta.default_value !== null && meta.default_value !== undefined
                    ? `@default ${JSON.stringify(meta.default_value)}`
                    : null,
                meta.display === 1 ? '@translatable' : '@property (locale="all")',
                meta.hidden === 1 ? '@hidden' : null,
                optionValues.length > 0
                    ? `@options ${optionValues.map((v) => JSON.stringify(v)).join(' | ')}`
                    : null,
            ]
                .filter(Boolean)
                .join(' ');
            const docBlock = doc ? `    /** ${doc} */\n` : '';
            const safeName = /^[a-zA-Z_][\w]*$/.test(fieldName)
                ? fieldName
                : JSON.stringify(fieldName);
            return `${docBlock}    ${safeName}?: IContentField<${type}>;`;
        });
    perStyleInterfaces.push(
        `export interface ${ifaceName} {\n${fieldLines.join('\n')}\n}`
    );
}

lines.push(
    '// --- Per-style field-shape interfaces ----------------------------------',
    '// These describe the *shape* of the `fields` map in the backend style',
    '// schema. They are intentionally narrow (every field is optional) so',
    '// the minimized export/import JSON shape type-checks cleanly.',
    '',
    perStyleInterfaces.join('\n\n'),
    ''
);

// Runtime default-value map — used by tooling (prompt-template generator,
// import pre-validation UI, mocks).
lines.push(
    '// --- Runtime default-value map -----------------------------------------',
    'export const STYLE_FIELD_DEFAULTS: Record<TStyleNameFromDb, Record<string, string | null>> = {'
);
for (const styleName of styleNames) {
    const fields = schema[styleName]?.fields ?? {};
    const entries = Object.keys(fields)
        .sort()
        .map((fieldName) => {
            const value = fields[fieldName]?.default_value;
            const safeKey = /^[a-zA-Z_][\w]*$/.test(fieldName)
                ? fieldName
                : JSON.stringify(fieldName);
            return `        ${safeKey}: ${tsStringLiteral(value)},`;
        });
    lines.push(`    ${tsStringLiteral(styleName)}: {`);
    for (const line of entries) lines.push(line);
    lines.push('    },');
}
lines.push('};', '');

// Runtime enum-options map — used by import validators, admin UI dropdown
// synthesis, and the AI prompt generator.
lines.push(
    '// --- Runtime option map (enum choices per field) ----------------------',
    'export const STYLE_FIELD_OPTIONS: Record<TStyleNameFromDb, Record<string, readonly string[]>> = {'
);
for (const styleName of styleNames) {
    const fields = schema[styleName]?.fields ?? {};
    lines.push(`    ${tsStringLiteral(styleName)}: {`);
    for (const fieldName of Object.keys(fields).sort()) {
        const values = sanitizeOptionValues(fields[fieldName]?.options);
        if (values.length === 0) continue;
        const safeKey = /^[a-zA-Z_][\w]*$/.test(fieldName)
            ? fieldName
            : JSON.stringify(fieldName);
        const arr = values.map((v) => tsStringLiteral(v)).join(', ');
        lines.push(`        ${safeKey}: [${arr}] as const,`);
    }
    lines.push('    },');
}
lines.push('};', '');

// Relationship maps for UI/validation tooling.
lines.push(
    '// --- Relationship maps ------------------------------------------------',
    'export const STYLE_ALLOWED_CHILDREN: Record<TStyleNameFromDb, readonly string[]> = {'
);
for (const styleName of styleNames) {
    const children = schema[styleName]?.allowed_children ?? [];
    const arr = children.map((c) => tsStringLiteral(c)).join(', ');
    lines.push(`    ${tsStringLiteral(styleName)}: [${arr}] as const,`);
}
lines.push('};', '');

lines.push(
    'export const STYLE_ALLOWED_PARENTS: Record<TStyleNameFromDb, readonly string[]> = {'
);
for (const styleName of styleNames) {
    const parents = schema[styleName]?.allowed_parents ?? [];
    const arr = parents.map((c) => tsStringLiteral(c)).join(', ');
    lines.push(`    ${tsStringLiteral(styleName)}: [${arr}] as const,`);
}
lines.push('};', '');

// Write file.
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, lines.join('\n'), 'utf8');
console.log(
    `[gen:styles] Wrote ${outputPath} (${lines.length} lines, ${styleNames.length} styles)`
);
