import React from 'react';
import { Divider } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IDividerStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for DividerStyle component
 */
interface IDividerStyleProps {
    style: IDividerStyle;
}

/**
 * DividerStyle component renders a Mantine Divider component for visual separation.
 * Supports various variants, sizes, labels, and orientations.
 *
 * @component
 * @param {IDividerStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Divider with styled configuration
 */
const DividerStyle: React.FC<IDividerStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const variant = getFieldContent(style, 'mantine_divider_variant') || 'solid';
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const label = getFieldContent(style, 'mantine_divider_label');
    const labelPosition = getFieldContent(style, 'mantine_divider_label_position') || 'center';
    const orientation = getFieldContent(style, 'mantine_orientation') || 'horizontal';
    const color = getFieldContent(style, 'mantine_color') || 'gray';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    if (use_mantine_style) {
        return (
            <Divider
                variant={variant as any}
                size={size}
                label={label}
                labelPosition={labelPosition as any}
                orientation={orientation as any}
                color={color}
                className={cssClass}
            />
        );
    }

    // Return null if Mantine styling is disabled (no fallback needed)
    return null;
};

export default DividerStyle;
