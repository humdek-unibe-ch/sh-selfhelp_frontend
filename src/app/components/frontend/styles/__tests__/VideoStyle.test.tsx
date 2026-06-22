/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import VideoStyle from '../VideoStyle';

/**
 * VideoStyle renders a single <video> from `video_src` (+ optional `poster_src`)
 * and maps the `has_controls` / `media_loop` / `media_autoplay` / `media_muted`
 * toggles to the native player. Autoplay must force muted (browser policy).
 */
type VideoStyleField = ComponentProps<typeof VideoStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): VideoStyleField =>
    ({ id: 1, style_name: 'video', ...overrides }) as unknown as VideoStyleField;

describe('VideoStyle', () => {
    it('renders a video element with the resolved source and poster', () => {
        const { container } = renderWithProviders(
            <VideoStyle
                style={makeStyle({
                    video_src: { content: '/uploads/clip.mp4' },
                    poster_src: { content: '/uploads/poster.png' },
                    alt: { content: 'No video support' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        const video = container.querySelector('video');
        expect(video).toBeInTheDocument();
        expect(video?.getAttribute('src')).toBeTruthy();
        expect(video?.getAttribute('poster')).toBeTruthy();
    });

    it('shows controls by default and honours the playback toggles', () => {
        const { container } = renderWithProviders(
            <VideoStyle
                style={makeStyle({
                    video_src: { content: '/uploads/clip.mp4' },
                    media_loop: { content: '1' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        const video = container.querySelector('video') as HTMLVideoElement;
        expect(video).toBeInTheDocument();
        expect(video.controls).toBe(true);
        expect(video.loop).toBe(true);
        expect(video.autoplay).toBe(false);
    });

    it('forces muted when autoplay is enabled and can hide controls', () => {
        const { container } = renderWithProviders(
            <VideoStyle
                style={makeStyle({
                    video_src: { content: '/uploads/clip.mp4' },
                    has_controls: { content: '0' },
                    media_autoplay: { content: '1' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        const video = container.querySelector('video') as HTMLVideoElement;
        expect(video.controls).toBe(false);
        expect(video.autoplay).toBe(true);
        expect(video.muted).toBe(true);
    });
});
