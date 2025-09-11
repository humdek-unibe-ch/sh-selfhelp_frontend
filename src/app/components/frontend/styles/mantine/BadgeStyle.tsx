import React from 'react';
import { Badge } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';
import { IBadgeStyle } from '../../../../../types/common/styles.types';

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
    const label = getFieldContent(style, 'label') || getFieldContent(style, 'content') || 'Badge';
    const variant = getFieldContent(style, 'mantine_variant') || 'filled';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const leftIconName = getFieldContent(style, 'mantine_left_icon');
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get left section icon
    const leftSection = leftIconName ? <IconComponent iconName={leftIconName} size={14} /> : undefined;

    if (use_mantine_style) {
        return (
            <Badge
                variant={variant as any}
                size={size}
                radius={radius}
                color={color}
                leftSection={leftSection}
                className={cssClass}
                style={styleObj}
            >
                {label}
            </Badge>
        );
    }

    // Fallback to basic span when Mantine styling is disabled
    return (
        <span
            className={cssClass}
            style={{
                ...styleObj,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: '500'
            }}
        >
            {leftSection}
            {label}
        </span>
    );
};

export default BadgeStyle;

