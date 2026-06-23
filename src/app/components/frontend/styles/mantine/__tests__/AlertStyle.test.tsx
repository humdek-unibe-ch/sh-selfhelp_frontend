/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import AlertStyle from '../AlertStyle';

/**
 * Regression for #5: the alert body (e.g. the maintenance page's
 * `{{system.maintenance_message}}` operator note, which arrives wrapped in
 * `<p>…</p>`) used to be dropped into JSX as a raw string, so visitors saw the
 * literal markup. It must now render as sanitized HTML — formatted text, no
 * literal tags — while still stripping XSS payloads.
 */
type AlertStyleProps = ComponentProps<typeof AlertStyle>;
type AlertStyleField = AlertStyleProps['style'];

function makeAlertStyle(overrides: Record<string, unknown>): AlertStyleField {
    return { id: 1, style_name: 'alert', ...overrides } as unknown as AlertStyleField;
}

describe('AlertStyle', () => {
    it('renders a plain-text message', () => {
        renderWithProviders(
            <AlertStyle style={makeAlertStyle({ content: { content: 'Hello QA' } })} styleProps={{}} cssClass="section-1" />,
        );
        expect(screen.getByText('Hello QA')).toBeInTheDocument();
    });

    it('renders authored HTML as formatted text, not literal tags', () => {
        const { container } = renderWithProviders(
            <AlertStyle style={makeAlertStyle({ content: { content: '<p>We are back soon</p>' } })} styleProps={{}} cssClass="section-1" />,
        );
        expect(screen.getByText('We are back soon')).toBeInTheDocument();
        // The literal markup must never be shown to the visitor.
        expect(container.innerHTML).not.toContain('&lt;p&gt;');
        expect(screen.queryByText('<p>We are back soon</p>')).not.toBeInTheDocument();
    });

    it('strips XSS payloads from the message', () => {
        renderWithProviders(
            <AlertStyle
                style={makeAlertStyle({ content: { content: '<p>safe note</p><img src="x" onerror="alert(1)">' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(screen.getByText('safe note')).toBeInTheDocument();
        expect(document.querySelector('img')).toBeNull();
    });

    it('renders a dismiss control when closable is on, and none when off', () => {
        const { rerender } = renderWithProviders(
            <AlertStyle
                style={makeAlertStyle({ content: { content: 'Dismiss me' }, closable: { content: '1' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();

        rerender(
            <AlertStyle
                style={makeAlertStyle({ content: { content: 'Dismiss me' }, closable: { content: '0' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    });
});
