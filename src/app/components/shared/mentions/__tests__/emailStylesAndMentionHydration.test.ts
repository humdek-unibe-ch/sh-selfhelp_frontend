/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { tokensToMentionHtml, sanitizeForDatabase } from '../../../../../config/mentions.config';
import {
    EMAIL_STYLE_PRESETS,
    EMAIL_STYLE_CLASSES,
    isEmailPresetClass,
} from '../EmailStyleExtension';

const vars: Record<string, string> = {
    'system.user_name': 'User name',
    'system.special.reset_link': 'Reset link',
};

/**
 * Issue #56 mail-link fix: `tokensToMentionHtml` must turn `{{token}}` into chips
 * ONLY in visible text, never inside an HTML attribute. A token inside an
 * `href="{{…}}"` previously produced `<a href="<span…>chip</span>" …>`, which
 * browsers/Tiptap mangled — leaking the rest of the tag (`" class="email-button">…`)
 * as raw text in the mail editor. These are regression guards for that bug.
 */
describe('tokensToMentionHtml (mail-link fix)', () => {
    it('turns a token in visible text into a mention chip', () => {
        const html = tokensToMentionHtml('Hello {{system.user_name}}', vars);
        expect(html).toContain('data-type="mention"');
        expect(html).toContain('data-id="system.user_name"');
        expect(html).toContain('User name');
    });

    it('leaves a token inside an href attribute untouched (no broken link)', () => {
        const input = '<p><a href="{{system.special.reset_link}}" class="email-button">Reset</a></p>';
        const html = tokensToMentionHtml(input, vars);
        expect(html).toContain('href="{{system.special.reset_link}}"');
        expect(html).not.toContain('href="<span');
        // The button class + visible link text survive intact.
        expect(html).toContain('class="email-button"');
        expect(html).toContain('>Reset</a>');
        // No chip was injected anywhere (the only token lived in the attribute).
        expect(html).not.toContain('data-type="mention"');
    });

    it('chips a text token even when the same token also appears in an attribute', () => {
        const input =
            '<a href="{{system.special.reset_link}}">link</a>' +
            '<p>{{system.special.reset_link}}</p>';
        const html = tokensToMentionHtml(input, vars);
        expect(html).toContain('href="{{system.special.reset_link}}"');
        const chipCount = (html.match(/data-type="mention"/g) ?? []).length;
        expect(chipCount).toBe(1);
    });

    it('leaves unknown tokens as literal text', () => {
        const html = tokensToMentionHtml('{{not_a_var}}', vars);
        expect(html).toContain('{{not_a_var}}');
        expect(html).not.toContain('data-type="mention"');
    });

    it('round-trips a text chip back to its {{token}} for storage', () => {
        const html = tokensToMentionHtml('Hi {{system.user_name}}', vars);
        const stored = sanitizeForDatabase(html);
        expect(stored).toContain('{{system.user_name}}');
        expect(stored).not.toContain('data-type="mention"');
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
