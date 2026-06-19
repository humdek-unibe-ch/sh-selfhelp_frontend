/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression coverage for the property/override "clear selection" fix.
 *
 * Variant select fields are seeded with `config.clearable: false`, which made
 * `SelectField` render the Mantine Select WITHOUT a clear (×) button — so an
 * author who set an override like badge `web_variant` could never remove it to
 * revert to the inherited/shared value. `SectionPropertyField` now forces
 * `clearable: true` on the config it hands to `FieldRenderer`, while
 * `SectionContentField` leaves content config untouched.
 *
 * `FieldRenderer` is mocked so we assert the exact config the connector forwards
 * (the contract the fix changes), not Mantine's internal clear-button DOM.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IFieldData } from '../../../shared/field-renderer/FieldRenderer';
import { useSectionFormStore } from '../../../../../store/sectionFormStore';
import type { ISectionField } from '../../../../../../types/responses/admin/admin.types';

// Capture the config `FieldRenderer` receives from each connector.
vi.mock('../../../shared/field-renderer/FieldRenderer', () => ({
    FieldRenderer: ({ field }: { field: IFieldData }) => (
        <div
            data-testid={`fr-${field.name}`}
            data-clearable={String(field.config?.clearable)}
        />
    ),
}));

import { SectionPropertyField, SectionContentField } from '../section-field-connectors';

function selectField(name: string): ISectionField {
    return {
        id: Math.floor(Math.random() * 1e6),
        name,
        scope: 'web',
        type: 'select',
        default_value: null,
        title: null,
        help: null,
        disabled: false,
        hidden: 0,
        display: false,
        // Seeded variant config: explicitly NOT clearable — the bug source.
        config: {
            clearable: false,
            searchable: false,
            options: [{ value: 'dot', text: 'Dot' }],
        },
        translations: [],
    } as unknown as ISectionField;
}

describe('SectionPropertyField — overrides are always clearable', () => {
    beforeEach(() => {
        useSectionFormStore.setState({ properties: { web_variant: 'dot' }, fields: {} });
    });

    it('forces clearable:true on a property/override select seeded clearable:false', () => {
        render(<SectionPropertyField field={selectField('web_variant')} />);
        expect(screen.getByTestId('fr-web_variant').getAttribute('data-clearable')).toBe('true');
    });

    it('leaves a content field config untouched (no forced clearable)', () => {
        const field = selectField('label');
        render(<SectionContentField field={field} languageId={1} />);
        // Content path passes config straight through → stays clearable:false.
        expect(screen.getByTestId('fr-label').getAttribute('data-clearable')).toBe('false');
    });

    it('does not crash when a property field has no config', () => {
        const field = { ...selectField('plain'), config: undefined } as unknown as ISectionField;
        render(<SectionPropertyField field={field} />);
        expect(screen.getByTestId('fr-plain').getAttribute('data-clearable')).toBe('undefined');
    });
});
