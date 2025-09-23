import React from 'react';
import { Badge } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
import { IBadgeStyle } from '../../../../../types/common/styles.types';
import { castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';

/**
 * Props interface for BadgeStyle component
 */
interface IBadgeStyleProps {
    style: IBadgeStyle;
}

/**
 * BadgeStyle component renders a Mantine Badge component for status indicators and labels.
 * Supports various variants, sizes, and optional icons.
 *
 * @component
 * @param {IBadgeStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Badge with styled configuration
 */
const BadgeStyle: React.FC<IBadgeStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = style.label?.content || 'Badge';
    const variant = style.mantine_variant?.content || 'filled';
    const size = castMantineSize((style as any).mantine_size?.content);
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const color = style.mantine_color?.content || 'blue';
    const leftIconName = style.mantine_left_icon?.content;
    const rightIconName = style.mantine_right_icon?.content;
    const auto_contrast = style.mantine_auto_contrast?.content;
    const use_mantine_style = style.use_mantine_style?.content === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get left and right section icons
    const leftSection = leftIconName ? <IconComponent iconName={leftIconName} size={14} /> : undefined;
    const rightSection = rightIconName ? <IconComponent iconName={rightIconName} size={14} /> : undefined;

    if (use_mantine_style) {
        return (
            <Badge
                variant={variant as any}
                size={size}
                radius={radius === 'none' ? 0 : radius}
                color={color}
                leftSection={leftSection}
                rightSection={rightSection}
                autoContrast={auto_contrast === '1'}
                className={cssClass}
                style={styleObj}
            >
                {label}
            </Badge>
        );
    }

    // Return null if Mantine styling is disabled (no fallback needed)
    return null;
};

export default BadgeStyle;

