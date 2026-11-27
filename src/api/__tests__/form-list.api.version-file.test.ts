/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { LANGUAGE_INDEPENDENT_ID } from '@selfhelp/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../base.api', () => ({
    permissionAwareApiClient: { get: vi.fn() },
}));

import { FormListApi } from '../frontend/form-list.api';

function query(href: string): URLSearchParams {
    return new URLSearchParams(href.slice(href.indexOf('?') + 1));
}

/**
 * The download link of a file an earlier version held. A file stored without a
 * language lives on the language-independent row, so the link defaults to it.
 */
describe('FormListApi.versionFileHref', () => {
    it('asks for the language-independent file when no file language is given', () => {
        const params = query(FormListApi.versionFileHref(5, 7, 2, 'photo', 11));

        expect(params.get('file_language')).toBe(String(LANGUAGE_INDEPENDENT_ID));
        expect(params.get('page_id')).toBe('11');
        expect(params.get('index')).toBe('0');
    });

    it('keeps an explicit file language', () => {
        const params = query(FormListApi.versionFileHref(5, 7, 2, 'photo', 11, { fileLanguage: 3, index: 1 }));

        expect(params.get('file_language')).toBe('3');
        expect(params.get('index')).toBe('1');
    });
});
