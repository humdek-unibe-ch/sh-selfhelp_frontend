/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import {
    buildVariableSuggestions,
    sanitizeForDatabase,
    tokensToMentionHtml,
    resolveTokenLabel,
} from '../mentions.config';

/**
 * Issue #56: the section `data_variables` payload is a `token => label` map.
 * The CMS variable picker must INSERT the stable token (`{{token}}`) but SHOW
 * the human label, so admins pick by a readable name while content always
 * stores the immutable key. `buildVariableSuggestions` is that translation and
 * is the single contract point both editors share.
 */
describe('buildVariableSuggestions (token/label mapping)', () => {
  it('maps each token to a picker item: id = inserted token, label = display text', () => {
    const result = buildVariableSuggestions({
      'record.mood_score': 'record.Daily mood',
      'system.user_name': 'system.user_name',
    });

    expect(result).toEqual([
      { id: 'record.mood_score', label: 'record.Daily mood' },
      { id: 'system.user_name', label: 'system.user_name' },
    ]);
  });

  it('keeps the token as an opaque literal even when it contains dots', () => {
    // A SurveyJS dynamic-panel key is dotted; it must travel through verbatim.
    const [item] = buildVariableSuggestions({ 'record.household.member_name': 'record.Member name' });
    expect(item.id).toBe('record.household.member_name');
    expect(item.label).toBe('record.Member name');
  });

  it('falls back to the token when no label is provided', () => {
    expect(buildVariableSuggestions({ 'record.x': '' })).toEqual([{ id: 'record.x', label: 'record.x' }]);
  });

  it('returns an empty list when there are no variables', () => {
    expect(buildVariableSuggestions(undefined)).toEqual([]);
    expect(buildVariableSuggestions({})).toEqual([]);
  });
});

/**
 * Issue #56 v2 — the interpolation chip round-trip.
 *
 * A variable is stored as the immutable `{{token}}` (e.g. `{{d.section_230}}`)
 * but shown to the admin as a chip carrying the human `display_name`. These
 * tests pin the round-trip that makes a rename safe: the visible label can
 * change freely, the stored token never does. Display names may contain spaces.
 */
describe('mentions chip round-trip (issue #56 v2)', () => {
    const dataVariables: Record<string, string> = {
        'd.section_230': 'Full name',
        'user.email': 'E-mail address',
    };

    it('hydrates a stored token into a label chip that keeps the token in data-id', () => {
        const html = tokensToMentionHtml('Hi {{d.section_230}}', dataVariables);

        expect(html).toContain('data-type="mention"');
        expect(html).toContain('data-id="d.section_230"');
        expect(html).toContain('data-label="Full name"');
        // The visible chip text is the human label, not the raw token.
        expect(html).toContain('>Full name<');
        expect(html).not.toContain('{{d.section_230}}');
    });

    it('leaves unknown tokens as literal text so nothing is lost', () => {
        const html = tokensToMentionHtml('Hi {{d.unknown_999}} and {{user.email}}', dataVariables);

        expect(html).toContain('{{d.unknown_999}}');
        expect(html).toContain('data-id="user.email"');
    });

    it('serializes a chip back to its immutable token from data-id, not the visible label', () => {
        const chip = '<p>Hi <span data-type="mention" class="mention-variable" data-id="d.section_230" data-label="Full name">Full name</span></p>';

        expect(sanitizeForDatabase(chip)).toBe('<p>Hi {{d.section_230}}</p>');
    });

    it('round-trips token -> chip -> token unchanged (rename safety)', () => {
        const stored = 'Dear {{d.section_230}}, your {{user.email}} is confirmed.';

        const hydrated = tokensToMentionHtml(stored, dataVariables);
        const serialized = sanitizeForDatabase(hydrated);

        expect(serialized).toBe(stored);
    });

    it('round-trips a display_name that contains spaces (golden rule)', () => {
        // A spaced display name must NOT break hydration: only the immutable
        // token lives between the braces, the spaces live in the label only.
        const variables = { 'd.section_230': 'First and last name' };
        const stored = 'Hello {{d.section_230}}!';

        const hydrated = tokensToMentionHtml(stored, variables);
        expect(hydrated).toContain('data-label="First and last name"');
        expect(hydrated).toContain('>First and last name<');
        // round-trips back to the exact token
        expect(sanitizeForDatabase(hydrated)).toBe(stored);
    });

    it('escapes HTML-unsafe characters in a label so the chip stays well-formed', () => {
        const html = tokensToMentionHtml('{{x}}', { x: 'A & B <c> "d"' });

        // The attribute escapes quotes too; text content leaves quotes literal.
        expect(html).toContain('data-label="A &amp; B &lt;c&gt; &quot;d&quot;"');
        expect(html).toContain('>A &amp; B &lt;c&gt; "d"<');
    });
});

/**
 * Issue #56 v2 — single-token label resolution used by one-chip widgets
 * (condition-builder field selector, custom-CSS pills). The stored value is the
 * immutable token; these widgets must show the readable display_name on reopen.
 * This is the spaces "golden rule" for the non-rich-text surfaces.
 */
describe('resolveTokenLabel (single-chip surfaces, issue #56 v2)', () => {
    const dataVariables: Record<string, string> = {
        'd.section_230': 'First and last name',
        'system.user_name': 'system.user_name',
    };

    it('resolves a braced token to its display label', () => {
        expect(resolveTokenLabel('{{d.section_230}}', dataVariables)).toBe('First and last name');
    });

    it('resolves a bare token to its display label', () => {
        expect(resolveTokenLabel('d.section_230', dataVariables)).toBe('First and last name');
    });

    it('keeps spaces in the resolved label intact (golden rule)', () => {
        // The label has spaces; the function returns it verbatim for display.
        expect(resolveTokenLabel('{{d.section_230}}', dataVariables)).toContain(' ');
        expect(resolveTokenLabel('{{d.section_230}}', dataVariables)).toBe('First and last name');
    });

    it('returns the raw value untouched for an unknown token', () => {
        expect(resolveTokenLabel('{{d.unknown}}', dataVariables)).toBe('{{d.unknown}}');
        expect(resolveTokenLabel('btn-primary', dataVariables)).toBe('btn-primary');
    });

    it('returns the raw value when no variable map is available', () => {
        expect(resolveTokenLabel('{{d.section_230}}', undefined)).toBe('{{d.section_230}}');
    });
});
