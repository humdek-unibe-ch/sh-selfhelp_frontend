/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Fails when source under `src/` still compares against bare language id 1 or
 * locale `all`. Every `__tests__` folder is excluded; use
 * `LANGUAGE_INDEPENDENT_*` / `isLanguageIndependent` from `@selfhelp/shared`.
 */
const SRC_ROOT = join(__dirname, '..', '..');

const FORBIDDEN = [
    /language_id\s*===\s*1\b/,
    /language_id\s*!==\s*1\b/,
    /languageId\s*===\s*1\b/,
    /language_id\s*>\s*1\b/,
    /locale\s*===\s*['"]all['"]/,
    // A language id that defaults to a bare 1 (fix-1): `fileLanguage ?? 1`,
    // `languages[0]?.id ?? 1`. Non-language `?? 1` (pages, counts) is not matched.
    /[Ll]anguage[\w[\]?.]*\s*\?\?\s*1\b/,
    // A row object that names the independent row by a bare 1 (fix-2):
    // `{ id_languages: 1 }`, `{ language_id: 1 }`.
    /\b(?:id_languages|language_id)\s*:\s*1\b/,
] as const;

function listSourceFiles(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) {
            if (name === '__tests__' || name === 'node_modules' || name === '.next') {
                continue;
            }
            out.push(...listSourceFiles(full));
            continue;
        }
        if (/\.(ts|tsx|js|mjs|cjs)$/.test(name) && !name.endsWith('.d.ts')) {
            out.push(full);
        }
    }
    return out;
}

describe('language-independent literals in src/', () => {
    it('uses LANGUAGE_INDEPENDENT_* / isLanguageIndependent instead of bare 1 or locale all', () => {
        const hits: string[] = [];
        for (const file of listSourceFiles(SRC_ROOT)) {
            const rel = relative(SRC_ROOT, file).split(sep).join('/');
            const text = readFileSync(file, 'utf8');
            for (const pattern of FORBIDDEN) {
                if (pattern.test(text)) {
                    hits.push(`${rel} matches ${pattern}`);
                }
            }
        }
        expect(hits).toEqual([]);
    });

    it('catches the language-id defaults removed in fix-1 and ignores counts', () => {
        const matches = (line: string) => FORBIDDEN.some((pattern) => pattern.test(line));
        expect(matches('file_language: String(options.fileLanguage ?? 1),')).toBe(true);
        expect(matches('const id = activeLanguage?.id ?? languages[0]?.id ?? 1;')).toBe(true);
        expect(matches('const id = languageId ?? 1;')).toBe(true);
        expect(matches('const page = options.page ?? 1;')).toBe(false);
        expect(matches('if (languages.length > 1) {')).toBe(false);
    });

    it('catches a row object with a bare language id 1 (fix-2) and ignores other `: 1`', () => {
        const matches = (line: string) => FORBIDDEN.some((pattern) => pattern.test(line));
        expect(matches('[{ record_id: listRecordId, id_languages: 1, ...(listPrefill as Record<string, unknown>) }]')).toBe(true);
        expect(matches('const row = { language_id: 1, value: text };')).toBe(true);
        expect(matches('[{ record_id: listRecordId, id_languages: LANGUAGE_INDEPENDENT_ID }]')).toBe(false);
        expect(matches('const row = { language_id: 12, value: text };')).toBe(false);
        expect(matches('const state = { page: 1, pageSize: 25 };')).toBe(false);
        expect(matches('const step = isFirst ? 0 : 1;')).toBe(false);
    });
});
