/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

// ButtonStyle calls `useRouter()` at render; mock it (mirrors ButtonStyle.test).
// The interception path calls the preview `navigate` instead of `router.push`.
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import {
    PreviewNavigationProvider,
    isPreviewInternalPath,
    previewPathFromHref,
} from '../PreviewNavigationContext';
import LinkStyle from '../../../frontend/styles/LinkStyle';
import ButtonStyle from '../../../frontend/styles/ButtonStyle';

/**
 * The Live Preview renders the public site INLINE (no iframe). Inside it, the
 * navigating style components must drive the preview (via the
 * `PreviewNavigationProvider` callback) instead of navigating the admin app —
 * but ONLY for internal CMS-page paths, and ONLY when the provider is present.
 */
describe('PreviewNavigationContext helpers', () => {
    it('treats internal CMS paths as preview-owned and app/external paths as not', () => {
        expect(isPreviewInternalPath('/impressum')).toBe(true);
        expect(isPreviewInternalPath('/')).toBe(true);
        expect(isPreviewInternalPath('/admin')).toBe(false);
        expect(isPreviewInternalPath('/admin/pages/test')).toBe(false);
        expect(isPreviewInternalPath('//evil.example')).toBe(false);
        expect(isPreviewInternalPath('https://x.test/y')).toBe(false);
        expect(isPreviewInternalPath('')).toBe(false);
        expect(isPreviewInternalPath(null)).toBe(false);
    });

    it('normalises hrefs to same-origin paths and drops external origins', () => {
        expect(previewPathFromHref('/impressum')).toBe('/impressum');
        expect(previewPathFromHref(`${window.location.origin}/impressum?x=1`)).toBe('/impressum?x=1');
        expect(previewPathFromHref('https://other.test/page')).toBeNull();
        expect(previewPathFromHref(null)).toBeNull();
    });
});

type LinkStyleField = ComponentProps<typeof LinkStyle>['style'];
const makeLink = (overrides: Record<string, unknown>): LinkStyleField =>
    ({ id: 1, style_name: 'link', ...overrides }) as unknown as LinkStyleField;

type ButtonStyleField = ComponentProps<typeof ButtonStyle>['style'];
const makeButton = (overrides: Record<string, unknown>): ButtonStyleField =>
    ({ id: 2, style_name: 'button', ...overrides }) as unknown as ButtonStyleField;

describe('preview navigation interception', () => {
    it('LinkStyle drives the preview for internal links instead of navigating', () => {
        const navigate = vi.fn();
        renderWithProviders(
            <PreviewNavigationProvider value={{ navigate }}>
                <LinkStyle
                    style={makeLink({ label: { content: 'Impressum' }, url: { content: '/impressum' } })}
                    styleProps={{}}
                    cssClass="section-1"
                />
            </PreviewNavigationProvider>,
        );
        const link = screen.getByRole('link', { name: 'Impressum' });
        const notDefaulted = fireEvent.click(link);
        expect(navigate).toHaveBeenCalledWith('/impressum');
        // preventDefault() was called → dispatchEvent returns false.
        expect(notDefaulted).toBe(false);
    });

    it('LinkStyle does NOT intercept external / new-tab links', () => {
        const navigate = vi.fn();
        renderWithProviders(
            <PreviewNavigationProvider value={{ navigate }}>
                <LinkStyle
                    style={makeLink({ label: { content: 'External' }, url: { content: 'https://ext.test' } })}
                    styleProps={{}}
                    cssClass="section-1"
                />
            </PreviewNavigationProvider>,
        );
        fireEvent.click(screen.getByRole('link', { name: 'External' }));
        expect(navigate).not.toHaveBeenCalled();
    });

    it('ButtonStyle drives the preview for internal navigation', () => {
        const navigate = vi.fn();
        renderWithProviders(
            <PreviewNavigationProvider value={{ navigate }}>
                <ButtonStyle
                    style={makeButton({ label: { content: 'Contact' }, url: { content: '/contact' } })}
                    styleProps={{}}
                    cssClass="section-1"
                />
            </PreviewNavigationProvider>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Contact' }));
        expect(navigate).toHaveBeenCalledWith('/contact');
    });

    it('LinkStyle keeps normal navigation when no preview provider is present', () => {
        renderWithProviders(
            <LinkStyle
                style={makeLink({ label: { content: 'Home' }, url: { content: '/home' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        const link = screen.getByRole('link', { name: 'Home' });
        // No interception → the anchor keeps its href and the click is not cancelled.
        expect(link).toHaveAttribute('href', '/home');
        const notDefaulted = fireEvent.click(link);
        expect(notDefaulted).toBe(true);
    });
});
