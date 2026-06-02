/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { getStatusColor, getUserStatusColor } from '../status-color.utils';

const PALETTE = ['blue', 'green', 'red', 'orange', 'yellow', 'purple', 'cyan', 'pink', 'indigo', 'teal', 'lime', 'grape'];

describe('getStatusColor', () => {
    it('returns gray for an empty status', () => {
        expect(getStatusColor('')).toBe('gray');
    });

    it('is deterministic for the same input', () => {
        expect(getStatusColor('processing')).toBe(getStatusColor('processing'));
    });

    it('always returns a color from the palette', () => {
        expect(PALETTE).toContain(getStatusColor('whatever-status'));
    });
});

describe('getUserStatusColor', () => {
    it('maps known user statuses to fixed colors (case-insensitive)', () => {
        expect(getUserStatusColor('active')).toBe('green');
        expect(getUserStatusColor('BLOCKED')).toBe('red');
        expect(getUserStatusColor('inactive')).toBe('red');
        expect(getUserStatusColor('pending')).toBe('yellow');
        expect(getUserStatusColor('invited')).toBe('yellow');
        expect(getUserStatusColor('interested')).toBe('blue');
        expect(getUserStatusColor('auto_created')).toBe('purple');
    });

    it('falls back to a hashed palette color for unknown statuses', () => {
        expect(PALETTE).toContain(getUserStatusColor('some-custom-status'));
    });
});
