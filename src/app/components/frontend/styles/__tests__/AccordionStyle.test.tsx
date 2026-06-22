/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { Accordion } from '@mantine/core';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * AccordionStyle + AccordionItemStyle are the composite collapsible styles. These
 * tests pin that each reads its CMS fields and renders its child sections through
 * the BasicStyle dispatcher — the cross-platform `accordion` / `accordion-item`
 * contract the mobile renderer mirrors.
 */
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

import AccordionStyle from '../mantine/accordion/AccordionStyle';
import AccordionItemStyle from '../mantine/accordion/AccordionItemStyle';

type AccordionStyleField = ComponentProps<typeof AccordionStyle>['style'];
type AccordionItemStyleField = ComponentProps<typeof AccordionItemStyle>['style'];

const makeAccordion = (overrides: Record<string, unknown>): AccordionStyleField =>
    ({ id: 1, style_name: 'accordion', ...overrides }) as unknown as AccordionStyleField;

const makeItem = (overrides: Record<string, unknown>): AccordionItemStyleField =>
    ({ id: 10, style_name: 'accordion-item', ...overrides }) as unknown as AccordionItemStyleField;

describe('AccordionStyle', () => {
    it('renders its accordion-item children through the BasicStyle dispatcher', () => {
        renderWithProviders(
            <AccordionStyle
                style={makeAccordion({
                    children: [
                        makeItem({ id: 11, label: { content: 'Panel one' } }),
                        makeItem({ id: 12, label: { content: 'Panel two' } }),
                    ],
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        // Mantine renders each accordion-item label as its Accordion.Control button.
        expect(screen.getByRole('button', { name: 'Panel one' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Panel two' })).toBeInTheDocument();
    });

    it('reads the cross-platform accordion_variant and applies the css class to the root', () => {
        const { container } = renderWithProviders(
            <AccordionStyle
                style={makeAccordion({ accordion_variant: { content: 'contained' } })}
                styleProps={{}}
                cssClass="section-2"
            />,
        );
        const root = container.querySelector('.section-2');
        expect(root).not.toBeNull();
        // The variant field must flow through to Mantine (data-variant on the root).
        expect(container.querySelector('[data-variant="contained"]')).not.toBeNull();
    });

    it('renders an empty accordion without throwing when children is missing', () => {
        const { container } = renderWithProviders(
            <AccordionStyle style={makeAccordion({})} styleProps={{}} cssClass="section-3" />,
        );
        expect(container.querySelector('.section-3')).not.toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
    });
});

describe('AccordionItemStyle', () => {
    const renderInAccordion = (item: AccordionItemStyleField, defaultValue: string | null = null) =>
        renderWithProviders(
            <Accordion defaultValue={defaultValue}>
                <AccordionItemStyle style={item} styleProps={{}} cssClass="section-item" />
            </Accordion>,
        );

    it('reads its label and optional description into the control', () => {
        renderInAccordion(
            makeItem({ id: 21, label: { content: 'FAQ heading' }, description: { content: 'Subtitle copy' } }),
        );
        expect(screen.getByText('FAQ heading')).toBeInTheDocument();
        expect(screen.getByText('Subtitle copy')).toBeInTheDocument();
    });

    it('disables the control when the disabled field is set', () => {
        renderInAccordion(makeItem({ id: 22, label: { content: 'Locked' }, disabled: { content: '1' } }));
        expect(screen.getByRole('button', { name: 'Locked' })).toBeDisabled();
    });

    it('renders its panel children through BasicStyle when expanded', () => {
        renderInAccordion(
            makeItem({
                id: 23,
                web_accordion_item_value: { content: 'open-me' },
                label: { content: 'Open section' },
                children: [{ id: 24, style_name: 'text', text: { content: 'Panel body copy' } }],
            }),
            'open-me',
        );
        expect(screen.getByText('Panel body copy')).toBeInTheDocument();
    });
});
