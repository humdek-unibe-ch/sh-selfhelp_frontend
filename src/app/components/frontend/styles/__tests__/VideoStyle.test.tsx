/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import VideoStyle from '../VideoStyle';

/**
 * VideoStyle renders a controls-enabled <video> with <source> children parsed
 * from a JSON sources string. Malformed/empty sources must not throw and simply
 * yield a video without sources.
 */
type VideoStyleField = ComponentProps<typeof VideoStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): VideoStyleField =>
    ({ id: 1, style_name: 'video', ...overrides }) as unknown as VideoStyleField;

describe('VideoStyle', () => {
    it('renders a video element with the configured source', () => {
        const { container } = renderWithProviders(
            <VideoStyle
                style={makeStyle({
                    sources: { content: JSON.stringify([{ source: '/clip.mp4', type: 'video/mp4' }]) },
                    alt: { content: 'No video support' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(container.querySelector('video')).toBeInTheDocument();
        const source = container.querySelector('source');
        expect(source).toHaveAttribute('src', '/clip.mp4');
        expect(source).toHaveAttribute('type', 'video/mp4');
    });

    it('renders a video without sources when the sources content is empty', () => {
        const { container } = renderWithProviders(
            <VideoStyle style={makeStyle({ sources: { content: '' } })} styleProps={{}} cssClass="section-1" />,
        );
        expect(container.querySelector('video')).toBeInTheDocument();
        expect(container.querySelector('source')).toBeNull();
    });
});
