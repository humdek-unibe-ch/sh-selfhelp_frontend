/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentProps } from 'react';
import { render } from '@testing-library/react';
import CarouselStyle from '../CarouselStyle';

/**
 * Regression for the carousel "arrows do nothing / images don't show" bug:
 * `web_carousel_slide_size` is a percentage slider saved as a bare number
 * (e.g. "100" meaning 100%). Mantine reads a unit-less slideSize as pixels,
 * collapsing every slide to ~100px so all slides fit the viewport and the
 * controls have nothing to scroll. The renderer must express a bare number as
 * a percentage while leaving explicitly-united values untouched. It must also
 * constrain slide media to the carousel height (via the `slide` className) only
 * when a height is configured, so height-less carousels keep natural sizing.
 */

// Capture the props the renderer hands to Mantine's Carousel without pulling
// embla into jsdom (it relies on layout the test environment cannot provide).
let capturedProps: Record<string, unknown> = {};
vi.mock('@mantine/carousel', () => {
    const Carousel = (props: Record<string, unknown>) => {
        capturedProps = props;
        return null;
    };
    Carousel.Slide = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
    return { Carousel };
});

type CarouselStyleField = ComponentProps<typeof CarouselStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): CarouselStyleField =>
    ({ id: 1, style_name: 'carousel', ...overrides }) as unknown as CarouselStyleField;

const renderCarousel = (overrides: Record<string, unknown>) =>
    render(<CarouselStyle style={makeStyle(overrides)} styleProps={{}} cssClass="section-1" />);

describe('CarouselStyle', () => {
    beforeEach(() => {
        capturedProps = {};
    });

    it('converts a bare slide-size number into a percentage', () => {
        renderCarousel({ web_carousel_slide_size: { content: '100' } });
        expect(capturedProps.slideSize).toBe('100%');
    });

    it('converts other bare numbers into percentages too', () => {
        renderCarousel({ web_carousel_slide_size: { content: '50' } });
        expect(capturedProps.slideSize).toBe('50%');
    });

    it('passes through values that already carry a unit', () => {
        renderCarousel({ web_carousel_slide_size: { content: '75%' } });
        expect(capturedProps.slideSize).toBe('75%');

        renderCarousel({ web_carousel_slide_size: { content: '300px' } });
        expect(capturedProps.slideSize).toBe('300px');
    });

    it('leaves slideSize undefined when the field is empty', () => {
        renderCarousel({});
        expect(capturedProps.slideSize).toBeUndefined();
    });

    it('constrains slide media to the carousel height only when a height is set', () => {
        renderCarousel({ web_height: { content: '260px' } });
        expect(capturedProps.classNames).toEqual({ slide: expect.any(String) });

        renderCarousel({});
        expect(capturedProps.classNames).toBeUndefined();
    });
});
