import React from 'react';
import { Divider } from '@mantine/core';
import { IDividerStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for DividerStyle component
 */
/**
 * Props interface for IDividerStyle component
 */
interface IDividerStyleProps {
    style: IDividerStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * DividerStyle component renders a Mantine Divider component for visual separation.
 * Supports various variants, sizes, labels, and orientations.
 *
 * @component
 * @param {IDividerStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Divider with styled configuration
 */
const DividerStyle: React.FC<IDividerStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const variant = style.mantine_divider_variant?.content || 'solid';
    const size = style.mantine_size?.content || 'sm';
    const label = style.mantine_divider_label?.content;
    const labelPosition = style.mantine_divider_label_position?.content || 'center';
    const orientation = style.mantine_orientation?.content || 'horizontal';
    const color = style.mantine_color?.content || 'gray';

    // Handle CSS field - use direct property from API response
    

    return (
        <Divider
            variant={variant as any}
            size={size}
            label={label}
            labelPosition={labelPosition as any}
            orientation={orientation as any}
            color={color}
            {...styleProps} className={cssClass}
        />
    );
};

export default DividerStyle;
