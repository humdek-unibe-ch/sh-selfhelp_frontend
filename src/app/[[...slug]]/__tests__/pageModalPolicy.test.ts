/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { shouldOpenPageInWebModal } from '../pageModalPolicy';

describe('shouldOpenPageInWebModal', () => {
    it('returns false when the page is missing', () => {
        expect(shouldOpenPageInWebModal(null)).toBe(false);
        expect(shouldOpenPageInWebModal(undefined)).toBe(false);
    });

    it('returns false for normal pages including off-menu pages', () => {
        expect(shouldOpenPageInWebModal({ open_in_modal: false })).toBe(false);
        expect(shouldOpenPageInWebModal({})).toBe(false);
    });

    it('returns true only when open_in_modal is set', () => {
        expect(shouldOpenPageInWebModal({ open_in_modal: true })).toBe(true);
    });
});
