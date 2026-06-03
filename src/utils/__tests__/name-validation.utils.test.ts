/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import {
    isValidName,
    sanitizeName,
    validateName,
    validateValidationCode,
} from '../name-validation.utils';

describe('isValidName', () => {
    it('accepts letters, numbers, hyphen, underscore and dot', () => {
        expect(isValidName('my-keyword_1.v2')).toBe(true);
    });

    it('rejects spaces and other special characters', () => {
        expect(isValidName('has space')).toBe(false);
        expect(isValidName('slash/here')).toBe(false);
        expect(isValidName('')).toBe(false);
    });
});

describe('sanitizeName', () => {
    it('strips disallowed characters but keeps allowed ones', () => {
        expect(sanitizeName('a b/c!d-e_1.2')).toBe('abcd-e_1.2');
    });
});

describe('validateName', () => {
    it('requires a non-empty name', () => {
        expect(validateName('   ')).toEqual({ isValid: false, error: 'Name is required' });
    });

    it('flags invalid characters with the shared error message', () => {
        const result = validateName('bad name');
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/letters, numbers/);
    });

    it('accepts a valid name', () => {
        expect(validateName('valid_name-1')).toEqual({ isValid: true });
    });
});

describe('validateValidationCode', () => {
    it('rejects codes longer than 16 characters', () => {
        const result = validateValidationCode('a'.repeat(17));
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/16 characters/);
    });

    it('accepts a valid short code', () => {
        expect(validateValidationCode('code_1')).toEqual({ isValid: true });
    });
});
