/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { FORM_SECTION_STYLE_NAMES } from '@selfhelp/shared';
import { type IStyle } from '../../types/responses/admin/styles.types';
import { isStyleAllowedAsChildOfParent, isStyleRelationshipValid } from '../style-relationship.utils';

function style(name: string, overrides: Partial<IStyle> = {}): IStyle {
    return {
        id: overrides.id ?? 1,
        name,
        description: null,
        typeId: 1,
        type: 'component',
        relationships: overrides.relationships ?? { allowedChildren: [], allowedParents: [] },
        ...overrides,
    };
}

describe('style-relationship.utils form-under-list deny', () => {
    const list = style('entry-form-list', { id: 10 });
    const textInput = style('text-input', { id: 20 });
    const container = style('container', { id: 30 });

    it.each([...FORM_SECTION_STYLE_NAMES])(
        'refuses %s as a direct child of entry-form-list',
        (formName) => {
            const child = style(formName, { id: 40 });
            expect(isStyleAllowedAsChildOfParent(child, list)).toBe(false);
            expect(isStyleRelationshipValid(child, list)).toBe(false);
        },
    );

    it('still allows inputs and containers under entry-form-list', () => {
        expect(isStyleRelationshipValid(textInput, list)).toBe(true);
        expect(isStyleRelationshipValid(container, list)).toBe(true);
    });

    it('still offers form-record at page level and under a container', () => {
        const formRecord = style('form-record', { id: 50 });
        expect(isStyleRelationshipValid(formRecord, null)).toBe(true);
        expect(isStyleRelationshipValid(formRecord, container)).toBe(true);
    });
});
