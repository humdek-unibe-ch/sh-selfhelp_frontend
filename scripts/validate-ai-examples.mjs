/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Schema-driven, DB-free validator for the curated AI section examples.
 *
 * Replaces the old `fix-ai-examples.mjs` (which patched fields that no longer
 * exist). Instead of a hand-written field list it validates every example in
 * `examples/sections/` against
 * `docs/reference/ai-prompts/style-schema.snapshot.json` — a committed snapshot
 * of the backend live style catalog (the same schema the runtime prompt is
 * built from, so CI needs no database).
 *
 * Checks (drift cannot silently return):
 *   - JSON syntax + top-level array shape;
 *   - known style (`unknown_style`);
 *   - field valid for style (`invalid_field_for_style`);
 *   - no obsolete naming (`mantine_*`, or `shared_*` other than the reserved
 *     `shared_width` / `shared_height` / `shared_icon`);
 *   - scope → locale correctness (content uses real locales, never `all`;
 *     common/web/mobile use `all` only);
 *   - structural slot constraints (slot child under required parent, required
 *     slot children under parent);
 *   - css_mobile classified through `@selfhelp/shared` without unexpected drops
 *     (a dropped token would silently vanish on native);
 *   - render-target compatibility (warn when a style is not `both`);
 *   - defaults omitted (warning — keeps examples compact).
 *
 * Enum *value* membership is intentionally not enforced here (the snapshot is
 * generated from an audit that omits option lists, and the importer enforces
 * enums server-side). Everything above is enforced.
 *
 * Usage (from the frontend repo root):
 *   node scripts/validate-ai-examples.mjs
 * Exit code 1 when any example has errors. The same exported functions back
 * `src/app/components/frontend/styles/__tests__/aiExamples.validation.test.ts`.
 */
import { readdir, readFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { classifyClassString } from '@selfhelp/shared';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..');
// All curated examples now live in the consolidated `examples/` tree
// (`examples/sections/` = single-section/page-content samples; `examples/cms-in-cms/`
// = importable page bundles). The schema snapshot stays under docs/reference.
const DEFAULT_EXAMPLES_DIR = join(REPO_ROOT, 'examples', 'sections');
const DEFAULT_SNAPSHOT_PATH = join(REPO_ROOT, 'docs', 'reference', 'ai-prompts', 'style-schema.snapshot.json');

// languages table — real human locales vs the property locale.
const REAL_LOCALES = new Set(['en-GB', 'de-CH']);
const PROPERTY_LOCALE = 'all';
const RESERVED_SHARED = new Set(['shared_width', 'shared_height', 'shared_icon']);
const GLOBAL_FIELD_KEYS = new Set(['condition', 'data_config', 'css', 'css_mobile', 'debug']);

// Documented HARD slot contract (structural rules in the prompt base).
const SLOT_CHILD_TO_PARENT = {
    'accordion-item': 'accordion',
    tab: 'tabs',
    'card-segment': 'card',
    'grid-column': 'grid',
    'list-item': 'list',
    'progress-section': 'progress-root',
    'timeline-item': 'timeline',
};
const SLOT_PARENT_TO_CHILD = Object.fromEntries(
    Object.entries(SLOT_CHILD_TO_PARENT).map(([child, parent]) => [parent, child]),
);

export async function loadSnapshot(snapshotPath = DEFAULT_SNAPSHOT_PATH) {
    return JSON.parse(await readFile(snapshotPath, 'utf8'));
}

/**
 * Validate a parsed example (array of sections) against the schema snapshot.
 * @returns {{ errors: Array<{file:string,path:string,message:string}>, warnings: Array<{file:string,path:string,message:string}> }}
 */
export function validateTree(sections, snapshot, file = '<inline>') {
    const errors = [];
    const warnings = [];
    const styles = (snapshot && snapshot.styles) || {};
    const err = (path, message) => errors.push({ file, path, message });
    const warn = (path, message) => warnings.push({ file, path, message });

    // Locale contract, data-driven from the snapshot (falls back to the seeded
    // baseline). `default` is the CMS default content language: a content field
    // missing it renders EMPTY for the default audience, because PageService's
    // render-time fallback is skipped when the requested language IS the default.
    const langCfg = (snapshot && snapshot.languages) || {};
    const defaultContentLocale =
        typeof langCfg.default === 'string' && langCfg.default !== '' ? langCfg.default : 'de-CH';
    const realLocales = new Set(
        Array.isArray(langCfg.content) && langCfg.content.length > 0 ? langCfg.content : [...REAL_LOCALES],
    );

    function checkField(styleName, styleDef, fname, fval, fpath) {
        if (fname.startsWith('mantine_')) {
            err(fpath, `obsolete field naming "${fname}" (the mantine_ prefix was removed).`);
        }
        if (fname.startsWith('shared_') && !RESERVED_SHARED.has(fname)) {
            err(fpath, `obsolete prefixed field "${fname}"; only shared_width/shared_height/shared_icon keep the shared_ prefix.`);
        }
        const fdef = styleDef.fields[fname];
        if (!fdef) {
            err(fpath, `invalid_field_for_style: "${fname}" is not a field of "${styleName}".`);
            return;
        }
        if (typeof fval !== 'object' || fval === null || Array.isArray(fval)) {
            err(fpath, 'field value must be a locale-keyed object, e.g. { "all": { "content": "…" } }.');
            return;
        }
        const localeKeys = Object.keys(fval);
        if (localeKeys.length === 0) {
            warn(fpath, 'empty field — omit it.');
            return;
        }
        const isContent = fdef.scope === 'content';
        for (const lk of localeKeys) {
            const entry = fval[lk];
            const valPath = `${fpath}.${lk}`;
            if (typeof entry !== 'object' || entry === null || Array.isArray(entry) || typeof entry.content !== 'string') {
                err(valPath, 'each locale entry must be an object with a string "content".');
                continue;
            }
                if (isContent) {
                    if (lk === PROPERTY_LOCALE) {
                        err(valPath, `content field "${fname}" must use a real locale (e.g. en-GB), never "all".`);
                    } else if (!realLocales.has(lk)) {
                        err(valPath, `unknown_locale "${lk}" (registered real locales: ${[...realLocales].join(', ')}).`);
                    }
                } else {
                if (lk !== PROPERTY_LOCALE) {
                    err(valPath, `property field "${fname}" (scope=${fdef.scope}) must use locale "all", not "${lk}".`);
                } else if (fdef.default !== undefined && fdef.default !== null && entry.content === String(fdef.default)) {
                        warn(valPath, `value equals the DB default ("${fdef.default}") — omit it to stay compact.`);
                    }
                }
            }

            // A content field must carry the default content language or it is
            // empty for the default audience (render-time fallback is skipped
            // when the requested language already IS the default).
            if (isContent && !Object.prototype.hasOwnProperty.call(fval, defaultContentLocale)) {
                err(
                    fpath,
                    `content field "${fname}" is missing the default content language "${defaultContentLocale}"; it would render empty for the default audience. Author every content field in all content languages (${[...realLocales].join(', ')}).`,
                );
            }
        }

    function walk(node, path, parentStyle) {
        if (!node || typeof node !== 'object' || Array.isArray(node)) {
            err(path, 'section must be a JSON object.');
            return;
        }
        const styleName = node.style_name;
        if (typeof styleName !== 'string' || styleName === '') {
            err(path, 'missing "style_name".');
            return;
        }
        const styleDef = styles[styleName];
        if (!styleDef) {
            err(path, `unknown_style: "${styleName}".`);
            return;
        }
        if (styleDef.renderTarget && styleDef.renderTarget !== 'both') {
            warn(path, `style "${styleName}" has renderTarget=${styleDef.renderTarget}; it will not render on every target.`);
        }

        const requiredParent = SLOT_CHILD_TO_PARENT[styleName];
        if (requiredParent && parentStyle !== requiredParent) {
            err(path, `"${styleName}" must be a direct child of "${requiredParent}" (found under ${parentStyle ?? 'root'}).`);
        }

        if (node.fields !== undefined) {
            if (typeof node.fields !== 'object' || node.fields === null || Array.isArray(node.fields)) {
                err(`${path}.fields`, 'fields must be an object.');
            } else {
                for (const [fname, fval] of Object.entries(node.fields)) {
                    checkField(styleName, styleDef, fname, fval, `${path}.fields.${fname}`);
                }
            }
        }

        if (node.global_fields !== undefined) {
            const gf = node.global_fields;
            if (typeof gf !== 'object' || gf === null || Array.isArray(gf)) {
                err(`${path}.global_fields`, 'global_fields must be an object.');
            } else {
                for (const key of Object.keys(gf)) {
                    if (!GLOBAL_FIELD_KEYS.has(key)) {
                        warn(`${path}.global_fields.${key}`, `unknown global field "${key}".`);
                    }
                }
                if (typeof gf.css_mobile === 'string' && gf.css_mobile.trim() !== '') {
                    const drops = [];
                    classifyClassString(gf.css_mobile, (decision) => {
                        if (decision.kind === 'drop') drops.push(decision.className);
                    });
                    if (drops.length > 0) {
                        err(
                            `${path}.global_fields.css_mobile`,
                            `tokens dropped on native (not in the mobile allow-list): ${drops.join(', ')}. Keep prefixed/variant/unsupported tokens in css instead.`,
                        );
                    }
                }
            }
        }

        if (node.children !== undefined) {
            if (!Array.isArray(node.children)) {
                err(`${path}.children`, 'children must be an array.');
            } else {
                const requiredChild = SLOT_PARENT_TO_CHILD[styleName];
                if (requiredChild && node.children.length === 0) {
                    warn(`${path}.children`, `"${styleName}" usually needs at least one "${requiredChild}" child.`);
                }
                node.children.forEach((child, i) => {
                    const childPath = `${path}.children[${i}]`;
                    if (requiredChild && child && typeof child === 'object' && child.style_name !== requiredChild) {
                        err(childPath, `"${styleName}" children must be "${requiredChild}" (found "${child.style_name}").`);
                    }
                    walk(child, childPath, styleName);
                });
            }
        }
    }

    if (!Array.isArray(sections)) {
        err('$', 'the top-level value must be an array of sections.');
        return { errors, warnings };
    }
    sections.forEach((section, i) => walk(section, `[${i}]`, null));
    return { errors, warnings };
}

export async function validateAllExamples({ examplesDir = DEFAULT_EXAMPLES_DIR, snapshotPath = DEFAULT_SNAPSHOT_PATH } = {}) {
    const snapshot = await loadSnapshot(snapshotPath);
    const files = (await readdir(examplesDir)).filter((f) => f.endsWith('.json')).sort();
    const errors = [];
    const warnings = [];
    for (const file of files) {
        let parsed;
        try {
            parsed = JSON.parse(await readFile(join(examplesDir, file), 'utf8'));
        } catch (e) {
            errors.push({ file, path: '$', message: `invalid JSON: ${e instanceof Error ? e.message : String(e)}` });
            continue;
        }
        const result = validateTree(parsed, snapshot, file);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
    }
    return { files, errors, warnings };
}

const invokedDirectly =
    typeof process.argv[1] === 'string' &&
    import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;

if (invokedDirectly) {
    validateAllExamples()
        .then(({ files, errors, warnings }) => {
            for (const w of warnings) console.warn(`WARN  ${w.file} ${w.path}: ${w.message}`);
            for (const e of errors) console.error(`ERROR ${e.file} ${e.path}: ${e.message}`);
            console.log(`\nChecked ${files.length} example file(s): ${errors.length} error(s), ${warnings.length} warning(s).`);
            process.exit(errors.length > 0 ? 1 : 0);
        })
        .catch((err) => {
            console.error(err);
            process.exit(2);
        });
}
