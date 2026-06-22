/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import SliderStyle from '../inputs/SliderStyle';
import RangeSliderStyle from '../inputs/RangeSliderStyle';

/**
 * Regression: a label-less slider must still receive the section `cssClass`
 * (and spacing props) so the `css` / `css_mobile` escape hatch works. Before
 * the fix the class was only applied to the Input.Wrapper, which is omitted
 * when there is no label/description — silently dropping custom styling.
 */
type SliderStyleField = ComponentProps<typeof SliderStyle>['style'];
type RangeSliderStyleField = ComponentProps<typeof RangeSliderStyle>['style'];

const makeSlider = (overrides: Record<string, unknown>): SliderStyleField =>
    ({ id: 1, style_name: 'slider', ...overrides }) as unknown as SliderStyleField;

const makeRangeSlider = (overrides: Record<string, unknown>): RangeSliderStyleField =>
    ({ id: 1, style_name: 'range-slider', ...overrides }) as unknown as RangeSliderStyleField;

describe('SliderStyle css class', () => {
    it('applies the section cssClass to a label-less slider root', () => {
        const { container } = renderWithProviders(
            <SliderStyle style={makeSlider({})} styleProps={{}} cssClass="section-42" />,
        );
        expect(container.querySelector('.section-42')).not.toBeNull();
    });

    it('applies the section cssClass on the wrapper when a label is present', () => {
        const { container } = renderWithProviders(
            <SliderStyle
                style={makeSlider({ label: { content: 'Volume' } })}
                styleProps={{}}
                cssClass="section-7"
            />,
        );
        expect(container.querySelector('.section-7')).not.toBeNull();
    });
});

describe('RangeSliderStyle css class', () => {
    it('applies the section cssClass to a label-less range slider root', () => {
        const { container } = renderWithProviders(
            <RangeSliderStyle style={makeRangeSlider({})} styleProps={{}} cssClass="section-99" />,
        );
        expect(container.querySelector('.section-99')).not.toBeNull();
    });
});
