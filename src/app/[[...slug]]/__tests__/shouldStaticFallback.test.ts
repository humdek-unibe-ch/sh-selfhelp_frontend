/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import type { IPageContent } from '../../../shared';
import { shouldStaticFallback } from '../shouldStaticFallback';

function page(
    partial: Partial<IPageContent> & Pick<IPageContent, 'keyword'>,
): IPageContent {
    return {
        id: 1,
        url: null,
        parent_page_id: null,
        is_headless: false,
        sections: [],
        ...partial,
    };
}

const sectionStub = {
    id: 1,
    section_name: 'login',
    id_styles: 1,
    style_name: 'login' as const,
    position: 1,
    level: 1,
    path: '1',
    children: [],
    can_have_children: null,
    condition: null,
    css: null,
    css_mobile: null,
    debug: null,
    data_config: null,
    section_data: [],
    fields: {},
};

describe('shouldStaticFallback (backend-authoritative)', () => {
    it('triggers when should_fallback is true with empty sections', () => {
        expect(
            shouldStaticFallback(page({ keyword: 'login', should_fallback: true, sections: [] })),
        ).toBe(true);
    });

    it('triggers when should_fallback is true with non-empty sections', () => {
        expect(
            shouldStaticFallback(
                page({
                    keyword: 'login',
                    should_fallback: true,
                    sections: [sectionStub],
                }),
            ),
        ).toBe(true);
    });

    it('does not trigger when should_fallback is false with empty sections', () => {
        expect(
            shouldStaticFallback(page({ keyword: 'login', should_fallback: false, sections: [] })),
        ).toBe(false);
    });

    it('does not trigger when should_fallback is false with non-empty sections', () => {
        expect(
            shouldStaticFallback(
                page({
                    keyword: 'login',
                    should_fallback: false,
                    sections: [sectionStub],
                }),
            ),
        ).toBe(false);
    });

    it('does not trigger when should_fallback is missing (not an old-backend shim)', () => {
        expect(shouldStaticFallback(page({ keyword: 'home', sections: [] }))).toBe(false);
        expect(
            shouldStaticFallback(page({ keyword: 'login', sections: [] })),
        ).toBe(false);
    });

    it('does not trigger for null/undefined page (caller owns 404)', () => {
        expect(shouldStaticFallback(null)).toBe(false);
        expect(shouldStaticFallback(undefined)).toBe(false);
    });

    it('does not infer from system keywords or empty hydrated shells', () => {
        expect(
            shouldStaticFallback(
                page({
                    keyword: 'profile',
                    sections: [],
                    should_fallback: undefined,
                }),
            ),
        ).toBe(false);
    });
});
