/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import AudioStyle from '../AudioStyle';

/**
 * AudioStyle renders a controls-enabled <audio> with <source> children parsed
 * from a JSON sources string. Malformed/empty sources must not throw.
 */
type AudioStyleField = ComponentProps<typeof AudioStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): AudioStyleField =>
    ({ id: 1, style_name: 'audio', ...overrides }) as unknown as AudioStyleField;

describe('AudioStyle', () => {
    it('renders an audio element with the configured source', () => {
        const { container } = renderWithProviders(
            <AudioStyle
                style={makeStyle({
                    sources: { content: JSON.stringify([{ source: '/track.mp3', type: 'audio/mpeg' }]) },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(container.querySelector('audio')).toBeInTheDocument();
        const source = container.querySelector('source');
        expect(source).toHaveAttribute('src', '/track.mp3');
        expect(source).toHaveAttribute('type', 'audio/mpeg');
    });

    it('renders an audio element without sources when the sources content is empty', () => {
        const { container } = renderWithProviders(
            <AudioStyle style={makeStyle({ sources: { content: '' } })} styleProps={{}} cssClass="section-1" />,
        );
        expect(container.querySelector('audio')).toBeInTheDocument();
        expect(container.querySelector('source')).toBeNull();
    });
});
