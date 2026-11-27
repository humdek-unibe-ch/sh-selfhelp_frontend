/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import {
    formFieldNeedsSetup,
    isTranslatableFormFieldStyle,
    styleHelpText,
} from '../scaffoldFormFieldMeta';

describe('scaffoldFormFieldMeta', () => {
    it('allows translatable only on text-input and textarea', () => {
        expect(isTranslatableFormFieldStyle('text-input')).toBe(true);
        expect(isTranslatableFormFieldStyle('textarea')).toBe(true);
        expect(isTranslatableFormFieldStyle('select')).toBe(false);
        expect(isTranslatableFormFieldStyle('number-input')).toBe(false);
        expect(isTranslatableFormFieldStyle('image')).toBe(false);
    });

    it('marks select, radio, image and files as needing setup', () => {
        expect(formFieldNeedsSetup('select')).toBe(true);
        expect(formFieldNeedsSetup('radio')).toBe(true);
        expect(formFieldNeedsSetup('image')).toBe(true);
        expect(formFieldNeedsSetup('files')).toBe(true);
        expect(formFieldNeedsSetup('text-input')).toBe(false);
        expect(formFieldNeedsSetup('checkbox')).toBe(false);
    });

    it('provides help text for every wizard type', () => {
        expect(styleHelpText('text-input')).toMatch(/one line/i);
        expect(styleHelpText('textarea')).toMatch(/several lines/i);
        expect(styleHelpText('select')).toMatch(/options after generating/i);
        expect(styleHelpText('image')).toMatch(/after generating/i);
        expect(styleHelpText('files')).toMatch(/after generating/i);
    });
});
