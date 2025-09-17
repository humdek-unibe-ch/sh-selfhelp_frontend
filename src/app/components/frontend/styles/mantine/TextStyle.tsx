import React from 'react';
import { Text } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ITextStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for TextStyle component
 */
interface ITextStyleProps {
    style: ITextStyle;
}

/**
 * TextStyle component renders a Mantine Text component for displaying styled text.
 * Supports various text styling options including size, color, font weight, style,
 * decoration, transform, alignment, gradient variants, truncation, and line clamping.
 * Follows Mantine Text API.
 *
 * @component
 * @param {ITextStyleProps} props - Component props
 * @returns {JSX.Element | null} Rendered Mantine Text or null when styling is disabled
 */
const TextStyle: React.FC<ITextStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const use_mantine_style = getFieldContent(style, 'use_mantine_style');

    // Skip rendering if Mantine styling is disabled
    if (use_mantine_style === '0') {
        return null;
    }

    // Extract text content
    const text = getFieldContent(style, 'text') || '';

    // Extract Mantine-specific props
    const size = getFieldContent(style, 'mantine_size') || 'md';
    const color = getFieldContent(style, 'mantine_color');
    const fontWeight = getFieldContent(style, 'mantine_text_font_weight');
    const fontStyle = getFieldContent(style, 'mantine_text_font_style');
    const textDecoration = getFieldContent(style, 'mantine_text_text_decoration');
    const textTransform = getFieldContent(style, 'mantine_text_text_transform');
    const textAlign = getFieldContent(style, 'mantine_text_align');
    const variant = getFieldContent(style, 'mantine_text_variant') || 'default';
    const truncate = getFieldContent(style, 'mantine_text_truncate') == 'none' ? undefined : getFieldContent(style, 'mantine_text_truncate');
    const lineClampStr = getFieldContent(style, 'mantine_text_line_clamp');
    const inherit = getFieldContent(style, 'mantine_text_inherit') === '1';
    const span = getFieldContent(style, 'mantine_text_span') === '1';

    // Parse gradient configuration for gradient variant
    let gradient;
    if (variant === 'gradient') {
        const gradientStr = getFieldContent(style, 'mantine_text_gradient');
        if (gradientStr) {
            try {
                gradient = JSON.parse(gradientStr);
            } catch (error) {
                console.warn('Invalid gradient configuration:', gradientStr);
            }
        }
    }

    // Parse line clamp value
    let lineClamp;
    if (lineClampStr) {
        const parsed = parseInt(lineClampStr);
        if (!isNaN(parsed) && parsed > 0) {
            lineClamp = parsed;
        }
    }

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    return (
        <Text
            size={size as any}
            c={color as any}
            fw={fontWeight ? parseInt(fontWeight) : undefined}
            fs={fontStyle as 'italic' | 'normal' | undefined}
            td={textDecoration as 'underline' | 'line-through' | 'none' | undefined}
            tt={textTransform as 'uppercase' | 'capitalize' | 'lowercase' | 'none' | undefined}
            ta={textAlign as 'left' | 'center' | 'right' | 'justify' | undefined}
            variant={variant as 'default' | 'gradient'}
            gradient={gradient}
            truncate={truncate as 'end' | 'start' | undefined}
            lineClamp={lineClamp}
            inherit={inherit}
            span={span}
            className={cssClass}
        >
            {text}
        </Text>
    );
};

export default TextStyle;
