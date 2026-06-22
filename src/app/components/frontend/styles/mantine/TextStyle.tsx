/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Text } from '@mantine/core';
import { type ITextStyle } from '../../../../../types/common/styles.types';
import { renderRichInline } from '../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for TextStyle component
 */
/**
 * Props interface for ITextStyle component
 */
interface ITextStyleProps {
    style: ITextStyle;
    styleProps: Record<string, string>;
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
    // Render the safe inline subset (bold / italic / underline / links) the
    // author applied via the `markdown-inline` editor instead of stripping it to
    // plain text, so Ctrl+B bold actually shows on the web frontend. The shared
    // helper flattens any stray block tags (`<p>` from markdown) to inline, strips
    // XSS, and renders hydration-safe; a plain string passes straight through.
    const text = renderRichInline(style.text?.content ?? '');

    // Extract Mantine-specific props
    const size = style.shared_size?.content || 'md';
    const color = style.shared_color?.content;
    const fontWeight = style.web_text_font_weight?.content;
    const fontStyle = style.web_text_font_style?.content;
    const textDecoration = style.web_text_text_decoration?.content;
    const textTransform = style.web_text_text_transform?.content;
    const textAlign = style.shared_text_align?.content;
    const variant = style.web_text_variant?.content || 'default';
    const truncate = style.web_text_truncate?.content == 'none' ? undefined : style.web_text_truncate?.content;
    const lineClampStr = style.web_text_line_clamp?.content;
    const inherit = style.web_text_inherit?.content === '1';
    const span = style.web_text_span?.content === '1';

    // Parse gradient configuration for gradient variant
    let gradient;
    if (variant === 'gradient') {
        const gradientStr = style.web_text_gradient?.content;
        if (gradientStr) {
            try {
                gradient = JSON.parse(gradientStr);
            } catch {
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
