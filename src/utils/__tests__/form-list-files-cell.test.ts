/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { formatListCell, isFileCell } from '../form-list.utils';

describe('form list file / image cells (contract 2)', () => {
    it('recognises the server files wrapper and never a bare array', () => {
        expect(isFileCell({ files: [{ index: 0, name: 'a.pdf', url: '/lists/1/records/2/files/doc?page_id=3&index=0' }] })).toBe(true);
        expect(isFileCell([{ index: 0, name: 'a.pdf', url: '/x' }] as never)).toBe(false);
        expect(isFileCell('uploads/form-files/x')).toBe(false);
        expect(formatListCell({ files: [{ index: 0, name: 'a.pdf', url: '/x' }] }, 'file')).toBe('');
    });
});
