import React from 'react';
import { Text } from '@mantine/core';
import { ITextStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for TextStyle component
 */
/**
 * Props interface for ITextStyle component
 */
interface ITextStyleProps {
    style: ITextStyle;
    styleProps: Record<string, any>;
    cssClass: string;
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
const TextStyle: React.FC<ITextStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const use_mantine_style = style.use_mantine_style?.content;

    // Skip rendering if Mantine styling is disabled
    if (use_mantine_style === '0') {
        return null;
    }

    // Extract text content
    const text = style.text?.content || '';

    // Extract Mantine-specific props
    const size = style.mantine_size?.content || 'md';
    const color = style.mantine_color?.content;
    const fontWeight = style.mantine_text_font_weight?.content;
    const fontStyle = style.mantine_text_font_style?.content;
    const textDecoration = style.mantine_text_text_decoration?.content;
    const textTransform = style.mantine_text_text_transform?.content;
    const textAlign = style.mantine_text_align?.content;
    const variant = style.mantine_text_variant?.content || 'default';
    const truncate = style.mantine_text_truncate?.content == 'none' ? undefined : style.mantine_text_truncate?.content;
    const lineClampStr = style.mantine_text_line_clamp?.content;
    const inherit = style.mantine_text_inherit?.content === '1';
    const span = style.mantine_text_span?.content === '1';

    // Parse gradient configuration for gradient variant
    let gradient;
    if (variant === 'gradient') {
        const gradientStr = style.mantine_text_gradient?.content;
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

    return (
        <Text
            size={size}
            c={color}
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
            {...styleProps} className={cssClass}
        >
            {text}
        </Text>
    );
};

export default TextStyle;
