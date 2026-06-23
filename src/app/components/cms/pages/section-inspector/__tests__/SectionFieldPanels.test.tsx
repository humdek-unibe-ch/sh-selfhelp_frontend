/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * RTL coverage for the platform-aware section inspector (#2):
 *   - SectionInfoPanel shows a Web / Mobile / Both platform badge.
 *   - SectionFieldPanels renders Web / Mobile / Properties cards, and
 *     gates the Web/Mobile cards by the style's platform (a mobile-only style
 *     hides the Web card; the Mobile card stays).
 *
 * The heavy field renderers are stubbed so the test asserts the card structure,
 * not the field editors. Platform is resolved from the real shared registry; the
 * milestone-one core catalog is all `both`, so the mobile-only case uses a
 * registered (plugin) mobile-only style (`button` = both).
 */
import { afterAll, beforeAll, describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
    extendStyleRegistry,
    _resetPluginStyleRegistry,
    type IStyleRegistryEntry,
} from '@selfhelp/shared/registry';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { useSectionFormStore } from '../../../../../store/sectionFormStore';
import type { ISectionField, ISectionDetails } from '../../../../../../types/responses/admin/admin.types';

// Stub the heavy field editors — we only assert the card structure here.
vi.mock('../section-field-connectors', () => ({
    SectionContentField: ({ field }: { field: ISectionField }) => <div>content:{field.name}</div>,
    SectionPropertyField: ({ field }: { field: ISectionField }) => <div>field:{field.name}</div>,
}));
vi.mock('../../../shared', () => ({
    GlobalFieldRenderer: () => null,
}));

import { SectionFieldPanels } from '../SectionFieldPanels';
import { SectionInfoPanel } from '../section-field-groups';

function makeField(
    name: string,
    display = false,
    scope: ISectionField['scope'] = 'content',
): ISectionField {
    return {
        id: Math.floor(Math.random() * 1e6),
        name,
        scope,
        type: 'text',
        default_value: null,
        title: null,
        help: null,
        disabled: false,
        hidden: 0,
        display,
        translations: [],
    };
}

// Backend-shaped fixtures: every field carries the scope the backend emits
// (two dimensions — display + prefix). `value` is an unprefixed display=0
// property, so the backend classifies it `common` -> Properties card.
const baseFields: ISectionField[] = [
    makeField('label', true, 'content'),
    makeField('size', false, 'common'),
    makeField('value', false, 'common'),
    makeField('web_card_shadow', false, 'web'),
    makeField('mobile_variant', false, 'mobile'),
];

const panelProps = {
    sectionId: 1,
    languagesData: [{ id: 1, language: 'English', locale: 'en' }],
    activeLanguageTab: '1',
    onLanguageTabChange: () => {},
    dataVariables: {},
    hasMultipleLanguages: false,
};

function sectionDetails(styleName: string): ISectionDetails {
    return {
        id: 1,
        name: 'demo',
        style: { id: 1, name: styleName, type: 'component', description: '' },
    } as unknown as ISectionDetails;
}

const MOBILE_ONLY: IStyleRegistryEntry = {
    description: 'QA mobile-only plugin style',
    category: 'plugin',
    canHaveChildren: false,
    platforms: ['mobile'],
};

beforeAll(() => {
    extendStyleRegistry({ 'qa-mobile-only': MOBILE_ONLY }, { pluginId: 'qa-shp-section-panels' });
});
afterAll(() => {
    _resetPluginStyleRegistry();
});

describe('SectionInfoPanel — platform badge', () => {
    it('shows a Mobile badge for a mobile-only style', () => {
        renderWithProviders(<SectionInfoPanel section={sectionDetails('qa-mobile-only')} />);
        expect(screen.getByText('Mobile')).toBeInTheDocument();
    });

    it('shows a Web + Mobile badge for a both-platform style', () => {
        renderWithProviders(<SectionInfoPanel section={sectionDetails('button')} />);
        expect(screen.getByText('Web + Mobile')).toBeInTheDocument();
    });
});

describe('SectionFieldPanels — platform-aware cards', () => {
    beforeEach(() => {
        useSectionFormStore.setState({ properties: {} });
    });

    it('renders Web / Mobile / Properties cards for a both-platform style', () => {
        renderWithProviders(<SectionFieldPanels {...panelProps} fields={baseFields} styleName="button" />);
        expect(screen.getByText('Properties')).toBeInTheDocument();
        expect(screen.getByText('Web Properties')).toBeInTheDocument();
        expect(screen.getByText('Mobile Properties')).toBeInTheDocument();
    });

    it('hides the Web card on a mobile-only style but keeps the Mobile card', () => {
        renderWithProviders(<SectionFieldPanels {...panelProps} fields={baseFields} styleName="qa-mobile-only" />);
        expect(screen.getByText('Mobile Properties')).toBeInTheDocument();
        expect(screen.queryByText('Web Properties')).not.toBeInTheDocument();
    });

    it('puts mobile_* fields under the Mobile card only', () => {
        renderWithProviders(<SectionFieldPanels {...panelProps} fields={baseFields} styleName="button" />);
        // The mobile_variant field stub renders once (inside the Mobile card).
        expect(screen.getByText('field:mobile_variant')).toBeInTheDocument();
        expect(screen.getByText('field:web_card_shadow')).toBeInTheDocument();
    });
});
