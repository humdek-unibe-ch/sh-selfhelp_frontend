/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

/**
 * Helpers for the section/config field help popover (issue #56 field audit).
 *
 * The CMS stores a free-text `help` per field plus an optional `default_value`.
 * For structured fields (JSON / CSS / raw HTML) and for any field whose help
 * embeds an example, we surface that example as a formatted, copy-able code
 * block in the help popover. These helpers extract that example and clean the
 * surrounding help text, with zero hard-coded per-field knowledge so every
 * field benefits automatically.
 */

export type TFieldHelpExampleLanguage = 'json' | 'css' | 'html' | 'text';

export interface IFieldHelpExample {
    code: string;
    language: TFieldHelpExampleLanguage;
}

/** Field types whose value is itself structured code, mapped to an editor language. */
const STRUCTURED_LANGUAGE: Record<string, TFieldHelpExampleLanguage> = {
    json: 'json',
    css: 'css',
    code: 'html',
};

/** Pretty-print a JSON string, or return null when it is not valid JSON. */
function tryPrettyJson(raw: string): string | null {
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
        return null;
    }
}

/**
 * Extract a balanced `[...]` / `{...}` snippet starting at `startIdx`, honouring
 * quoted strings so brackets inside string literals do not unbalance the scan.
 * Returns null when the brackets never close.
 */
function extractBalanced(text: string, startIdx: number): string | null {
    const open = text[startIdx];
    const close = open === '[' ? ']' : '}';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = startIdx; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') inString = true;
        else if (ch === open) depth++;
        else if (ch === close) {
            depth--;
            if (depth === 0) return text.slice(startIdx, i + 1);
        }
    }
    return null;
}

/** Match a fenced ```...``` code block (optionally language-tagged). */
const FENCED_BLOCK = /```[a-zA-Z]*\s*([\s\S]*?)```/;

/** Mine a help string for a usable example: a fenced block, else balanced JSON. */
function exampleFromHelp(help: string): IFieldHelpExample | null {
    const fenced = help.match(FENCED_BLOCK);
    if (fenced && fenced[1].trim()) {
        const code = fenced[1].trim();
        const pretty = tryPrettyJson(code);
        return { code: pretty ?? code, language: pretty ? 'json' : 'text' };
    }

    const bracketIdx = help.search(/[[{]/);
    if (bracketIdx >= 0) {
        const snippet = extractBalanced(help, bracketIdx);
        if (snippet) {
            const pretty = tryPrettyJson(snippet);
            if (pretty) return { code: pretty, language: 'json' };
        }
    }
    return null;
}

/**
 * Resolve the copy-able example for a field. Prefers the field's own
 * `default_value` when the field type is structured (JSON / CSS / code),
 * otherwise mines the help text. Returns null when there is nothing useful.
 */
export function extractFieldHelpExample(
    fieldType: string | null | undefined,
    defaultValue: string | null | undefined,
    help: string | null | undefined,
): IFieldHelpExample | null {
    const lang = STRUCTURED_LANGUAGE[fieldType ?? ''];

    const dflt = defaultValue?.trim();
    if (lang && dflt) {
        const code = lang === 'json' ? (tryPrettyJson(dflt) ?? dflt) : dflt;
        return { code, language: lang };
    }

    const helpText = help?.trim();
    if (helpText) {
        const mined = exampleFromHelp(helpText);
        if (mined) {
            // Keep the field's own language label when it is a structured field.
            return lang ? { code: mined.code, language: lang } : mined;
        }
    }
    return null;
}

/**
 * Strip fenced code blocks from help text for display (the example is shown
 * separately as a formatted block), collapsing the blank lines they leave.
 */
export function helpTextForDisplay(help: string | null | undefined): string {
    if (!help) return '';
    return help.replace(new RegExp(FENCED_BLOCK, 'g'), '').replace(/\n{3,}/g, '\n\n').trim();
}
