/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Divider } from '@mantine/core';
import { type IDividerStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for DividerStyle component
 */
/**
 * Props interface for IDividerStyle component
 */
interface IDividerStyleProps {
    style: IDividerStyle;
    styleProps: Record<string, string>;
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
    const variant = style.shared_divider_variant?.content || 'solid';
    const size = style.shared_size?.content || 'sm';
    const label = style.divider_label?.content;
    const labelPosition = style.shared_divider_label_position?.content || 'center';
    const orientation = style.shared_orientation?.content || 'horizontal';
    const color = style.shared_color?.content || 'gray';

    // Handle CSS field - use direct property from API response
    

    return (
        <Divider
            variant={variant}
            size={size}
            label={label}
            labelPosition={labelPosition as 'left' | 'center' | 'right'}
            orientation={orientation}
            color={color}
            {...styleProps} className={cssClass}
        />
    );
};

export default DividerStyle;
