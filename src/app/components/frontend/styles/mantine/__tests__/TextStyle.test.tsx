/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import TextStyle from '../TextStyle';

/**
 * Higher-risk subject (Slice 6): a representative text style component. It
 * renders interpolated CMS content, so the test pins that the text is shown,
 * that DOMPurify strips markup/handlers (defense in depth on top of the
 * dispatcher), and that the Mantine-disabled escape hatch renders nothing.
 */
type TextStyleProps = ComponentProps<typeof TextStyle>;
type TextStyleField = TextStyleProps['style'];

function makeTextStyle(overrides: Record<string, unknown>): TextStyleField {
    return { id: 1, style_name: 'text', ...overrides } as unknown as TextStyleField;
}

describe('TextStyle', () => {
    it('renders the configured text content', () => {
        renderWithProviders(
            <TextStyle style={makeTextStyle({ text: { content: 'Hello QA' } })} styleProps={{}} cssClass="section-1" />,
        );
        expect(screen.getByText('Hello QA')).toBeInTheDocument();
    });

    it('sanitizes markup and event handlers out of the text', () => {
        renderWithProviders(
            <TextStyle
                style={makeTextStyle({ text: { content: '<img src="x" onerror="alert(1)">danger' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(screen.getByText('danger')).toBeInTheDocument();
        expect(document.querySelector('img')).toBeNull();
    });

    it('renders nothing when Mantine styling is disabled', () => {
        renderWithProviders(
            <TextStyle
                style={makeTextStyle({ text: { content: 'should-not-render' }, use_mantine_style: { content: '0' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(screen.queryByText('should-not-render')).not.toBeInTheDocument();
    });
});
