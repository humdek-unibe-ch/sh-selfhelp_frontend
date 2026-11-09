/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

vi.mock('../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({ languages: [], isLoading: false }),
}));

import TextareaStyle from '../mantine/inputs/TextareaStyle';
import RadioStyle from '../mantine/inputs/RadioStyle';
import ComboboxStyle from '../mantine/inputs/ComboboxStyle';
import SliderStyle from '../mantine/inputs/SliderStyle';
import RangeSliderStyle from '../mantine/inputs/RangeSliderStyle';
import RichTextEditorStyle from '../mantine/inputs/rich-text-editor/RichTextEditorStyle';

const OPTIONS = '[{"value":"a","text":"Option A"},{"value":"b","text":"Option B"}]';
const style = <T,>(styleName: string, extra: Record<string, unknown> = {}): T =>
    ({ id: 1, style_name: styleName, label: { content: 'Your answer' }, name: { content: 'qa_field' }, ...extra }) as unknown as T;

/**
 * A2: public form controls are named by their configured label (they used to
 * show it visually only), radio options by their text, and the combobox can
 * be reached and opened from the keyboard.
 */
describe('public form inputs', () => {
    it('names the textarea by its label', () => {
        renderWithProviders(<TextareaStyle style={style<ComponentProps<typeof TextareaStyle>['style']>('textarea')} styleProps={{}} cssClass="" />);
        expect(screen.getByRole('textbox', { name: 'Your answer' })).toBeInTheDocument();
    });

    it('names each radio option by its text', () => {
        renderWithProviders(<RadioStyle style={style<ComponentProps<typeof RadioStyle>['style']>('radio', { radio_options: { content: OPTIONS } })} styleProps={{}} cssClass="" />);
        expect(screen.getByRole('radio', { name: 'Option A' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Option B' })).toBeInTheDocument();
    });

    it('names the sliders by the label', () => {
        renderWithProviders(<SliderStyle style={style<ComponentProps<typeof SliderStyle>['style']>('slider')} styleProps={{}} cssClass="" />);
        expect(screen.getByRole('slider', { name: 'Your answer' })).toBeInTheDocument();
    });

    it('names both range slider thumbs', () => {
        renderWithProviders(<RangeSliderStyle style={style<ComponentProps<typeof RangeSliderStyle>['style']>('range-slider')} styleProps={{}} cssClass="" />);
        expect(screen.getByRole('slider', { name: 'Your answer (from)' })).toBeInTheDocument();
        expect(screen.getByRole('slider', { name: 'Your answer (to)' })).toBeInTheDocument();
    });

    it('names the rich text editor by its label', async () => {
        renderWithProviders(<RichTextEditorStyle style={style<ComponentProps<typeof RichTextEditorStyle>['style']>('rich-text-editor')} styleProps={{}} cssClass="" />);
        expect(await screen.findByRole('textbox', { name: 'Your answer' })).toBeInTheDocument();
    });

    it('lets keyboard users reach and open the combobox', () => {
        renderWithProviders(<ComboboxStyle style={style<ComponentProps<typeof ComboboxStyle>['style']>('combobox', { combobox_options: { content: OPTIONS } })} styleProps={{}} cssClass="" />);

        const trigger = screen.getByRole('combobox', { name: 'Your answer' });
        expect(trigger).toHaveAttribute('tabindex', '0');

        trigger.focus();
        fireEvent.keyDown(trigger, { key: 'Enter' });
        expect(screen.getByRole('option', { name: 'Option A', hidden: true })).toBeInTheDocument();
    });
});
