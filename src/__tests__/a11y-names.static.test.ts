/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * A1/A2 guard: every icon-only button and every input in the app has an
 * accessible name. Only a tag's own attributes count; JSX nested in a prop
 * (e.g. a clear button inside `rightSection`) must not hide a missing name.
 * A spread (`{...props}`) is trusted to carry the name.
 */
const SRC = join(__dirname, '..');
const INPUTS = 'TextInput|Select|MultiSelect|Textarea|NumberInput|Autocomplete|PasswordInput|TagsInput|DateInput|DatePickerInput|ColorInput|JsonInput|FileInput|Combobox\\.Search';

function tsxFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return name === '__tests__' ? [] : tsxFiles(path);
        return name.endsWith('.tsx') && !name.endsWith('.test.tsx') ? [path] : [];
    });
}

/** The opening tag starting at `start`, with nested `{...}` collapsed to `{}`. */
function ownAttributes(src: string, start: number): string {
    let depth = 0;
    let out = '';
    for (let i = start; i < src.length; i++) {
        const c = src[i];
        if (c === '{') {
            if (depth === 0) out += '{';
            depth++;
        } else if (c === '}') {
            depth--;
            if (depth === 0) out += '}';
        } else if (depth === 0) {
            out += c;
            if (c === '>') break;
        }
    }
    return out;
}

function unnamed(): string[] {
    const misses: string[] = [];
    for (const file of tsxFiles(SRC)) {
        const src = readFileSync(file, 'utf8');
        const checks: Array<[RegExp, RegExp]> = [
            [/<ActionIcon\b/g, /\baria-label(ledby)?=|\baria-hidden=|(?<!=)\{\}/],
            [new RegExp(`<(${INPUTS})\\b`, 'g'), /\baria-label(ledby)?=|\blabel=|\bid=|(?<!=)\{\}/],
        ];
        for (const [tag, named] of checks) {
            for (const match of src.matchAll(tag)) {
                if (!named.test(ownAttributes(src, match.index ?? 0))) {
                    const line = src.slice(0, match.index).split('\n').length;
                    misses.push(`${relative(SRC, file)}:${line}`);
                }
            }
        }
    }
    return misses;
}

describe('accessible names', () => {
    it('every ActionIcon and input has a name', () => {
        expect(unnamed()).toEqual([]);
    });
});
