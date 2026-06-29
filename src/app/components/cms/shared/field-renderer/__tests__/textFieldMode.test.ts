/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { resolveTextFieldMode } from '../FieldRenderer';
import {
    EMAIL_STYLE_PRESETS,
    EMAIL_STYLE_CLASSES,
    isEmailPresetClass,
} from '../../../../shared/mentions/EmailStyleExtension';

/**
 * Issue #56 multiline: `text` / `markdown-inline` fields render differently by
 * name. Short identifiers stay plain inputs, labels/captions stay single-line,
 * and everything else auto-grows. This guards that mapping so a future rename of
 * the allowlists is a conscious, tested change.
 */
describe('resolveTextFieldMode', () => {
    it('renders short identifiers as plain inputs (no mentions)', () => {
        for (const name of ['name', 'value', 'title']) {
            expect(resolveTextFieldMode(name)).toBe('plain');
        }
    });

    it('keeps labels and short captions on a single line', () => {
        for (const name of ['label', 'subtitle', 'placeholder', 'alt', 'caption']) {
            expect(resolveTextFieldMode(name)).toBe('single-line');
        }
    });

    it('auto-grows any other text field (alerts, descriptions, free copy)', () => {
        for (const name of ['text', 'alert', 'description', 'message', 'unknown_field']) {
            expect(resolveTextFieldMode(name)).toBe('multiline');
        }
    });
});

/**
 * Issue #56 mail editor: the email "Style" presets are a cross-file contract with
 * the backend MailHtmlRenderer. These guard the shape the editor + renderer rely
 * on (stable ids, unique `email-*` classes, and the class recogniser).
 */
describe('email style presets', () => {
    it('exposes the six documented presets with the expected ids and classes', () => {
        expect(EMAIL_STYLE_PRESETS).toHaveLength(6);
        const byId = Object.fromEntries(EMAIL_STYLE_PRESETS.map((p) => [p.id, p.className]));
        expect(byId).toEqual({
            primary_button: 'email-button',
            secondary_button: 'email-button-secondary',
            text_link_strong: 'email-link-strong',
            muted_text: 'email-muted',
            callout_box: 'email-callout',
            code_block: 'email-code',
        });
    });

    it('keeps preset ids and classes unique', () => {
        const ids = EMAIL_STYLE_PRESETS.map((p) => p.id);
        const classes = EMAIL_STYLE_PRESETS.map((p) => p.className);
        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(classes).size).toBe(classes.length);
    });

    it('recognises exactly the known preset classes (trimmed), nothing else', () => {
        for (const className of EMAIL_STYLE_CLASSES) {
            expect(isEmailPresetClass(className)).toBe(true);
            expect(isEmailPresetClass(`  ${className}  `)).toBe(true);
        }
        expect(isEmailPresetClass('mention-variable')).toBe(false);
        expect(isEmailPresetClass('email-unknown')).toBe(false);
        expect(isEmailPresetClass('')).toBe(false);
    });
});
