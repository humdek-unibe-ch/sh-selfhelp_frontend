/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Badge } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
import { type IBadgeStyle } from '../../../../../types/common/styles.types';
import { castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';
import { stripHtmlTags } from '../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for BadgeStyle component
 */
/**
 * Props interface for IBadgeStyle component
 */
interface IBadgeStyleProps {
    style: IBadgeStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * BadgeStyle component renders a Mantine Badge component for status indicators and labels.
 * Supports various variants, sizes, and optional icons.
 *
 * @component
 * @param {IBadgeStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Badge with styled configuration
 */
const BadgeStyle: React.FC<IBadgeStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure. The badge is a
    // plain-text leaf slot, so strip any HTML the label may carry (e.g. markdown
    // processed to `<p class="…">…</p>`) instead of rendering literal tags.
    const label = stripHtmlTags(style.label?.content || 'Badge');
    // Web-only `web_variant` overrides the cross-platform `shared_variant`.
    const variant = style.web_variant?.content || style.shared_variant?.content || 'filled';
    const size = castMantineSize(style.shared_size?.content);
    const radius = castMantineRadius(style.shared_radius?.content);
    const color = style.shared_color?.content || 'blue';
    const circle = style.circle?.content === '1';
    const leftIconName = style.web_left_icon?.content;
    const rightIconName = style.web_right_icon?.content;
    const auto_contrast = style.web_auto_contrast?.content;
    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get left and right section icons
    const leftSection = leftIconName ? <IconComponent iconName={leftIconName} size={14} /> : undefined;
    const rightSection = rightIconName ? <IconComponent iconName={rightIconName} size={14} /> : undefined;

    return (
        <Badge
            variant={variant}
            size={size}
            radius={radius === 'none' ? 0 : radius}
            color={color}
            circle={circle}
            leftSection={leftSection}
            rightSection={rightSection}
            autoContrast={auto_contrast === '1'}
            {...styleProps} className={cssClass}
            style={styleObj}
        >
            {label}
        </Badge>
    );
};

export default BadgeStyle;

