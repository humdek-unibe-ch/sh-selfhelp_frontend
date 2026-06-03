/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import React from 'react';
import { STYLE_IMPLS, getCssClass, getSpacingProps } from '../BasicStyle';

/**
 * Higher-risk subject (Slice 6): BasicStyle is the recursive style dispatcher.
 * The renderer map (`STYLE_IMPLS`, exposed for tests) and the css/spacing
 * extractors run for every section on every page, so their contract is pinned
 * here without booting the plugin runtime.
 */
type CssArg = Parameters<typeof getCssClass>[0];
type SpacingArg = Parameters<typeof getSpacingProps>[0];

describe('BasicStyle dispatcher map', () => {
    it('maps documented core style names to a renderer', () => {
        for (const name of ['text', 'container', 'button', 'form-log', 'form-record']) {
            expect(typeof STYLE_IMPLS[name]).toBe('function');
        }
    });

    it('does not resolve a renderer for an unknown style name (falls through to plugin/unknown)', () => {
        expect(STYLE_IMPLS['definitely-not-a-real-style']).toBeUndefined();
    });

    it('dispatches the "text" entry to a valid React element', () => {
        const renderer = STYLE_IMPLS.text;
        type RProps = Parameters<typeof renderer>[0];
        const props: RProps = {
            style: { id: 1, style_name: 'text', text: { content: 'hello' } } as unknown as RProps['style'],
            styleProps: {},
            cssClass: 'section-1',
        };
        expect(React.isValidElement(renderer(props))).toBe(true);
    });
});

describe('BasicStyle getCssClass', () => {
    it('composes section id, css, and a max-md-prefixed mobile class', () => {
        const style = { id: 5, css: 'p-2', css_mobile: 'p-1' } as unknown as CssArg;
        expect(getCssClass(style)).toBe('section-5 p-2 max-md:p-1');
    });

    it('keeps a mobile token that already carries a viewport prefix', () => {
        const style = { id: 1, css: 'a', css_mobile: 'md:b' } as unknown as CssArg;
        expect(getCssClass(style)).toBe('section-1 a md:b');
    });

    it('falls back to just the section class when css fields are absent', () => {
        const style = { id: 2 } as unknown as CssArg;
        expect(getCssClass(style)).toBe('section-2');
    });
});

describe('BasicStyle getSpacingProps', () => {
    const withSpacing = (content: string): SpacingArg =>
        ({ id: 3, style_name: 'box', mantine_spacing_margin_padding: { content } }) as unknown as SpacingArg;

    it('parses a JSON spacing object into Mantine spacing props', () => {
        expect(getSpacingProps(withSpacing('{"mt":"md","pb":"lg"}'))).toEqual({ mt: 'md', pb: 'lg' });
    });

    it('drops "none" values', () => {
        expect(getSpacingProps(withSpacing('{"mt":"none","mb":"sm"}'))).toEqual({ mb: 'sm' });
    });

    it('returns an empty object for invalid JSON without throwing', () => {
        expect(getSpacingProps(withSpacing('not json'))).toEqual({});
    });

    it('returns an empty object when no spacing field is present', () => {
        expect(getSpacingProps({ id: 4, style_name: 'box' } as unknown as SpacingArg)).toEqual({});
    });
});
