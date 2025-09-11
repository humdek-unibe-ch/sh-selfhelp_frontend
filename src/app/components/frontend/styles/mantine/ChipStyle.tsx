import React from 'react';
import { Chip } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IChipStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for ChipStyle component
 */
interface IChipStyleProps {
    style: IChipStyle;
}

/**
 * ChipStyle component renders a Mantine Chip component for selectable tags.
 * Supports various variants, sizes, and selection states.
 *
 * @component
 * @param {IChipStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Chip with styled configuration
 */
const ChipStyle: React.FC<IChipStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label') || getFieldContent(style, 'content') || 'Chip';
    const variant = getFieldContent(style, 'mantine_chip_variant') || 'filled';
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const checked = getFieldContent(style, 'mantine_chip_checked') === '1';
    const multiple = getFieldContent(style, 'mantine_chip_multiple') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Chip
                checked={checked}
                variant={variant as any}
                size={size as any}
                radius={radius as any}
                color={color}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            >
                {label}
            </Chip>
        );
    }

    // Fallback to basic checkbox with label when Mantine styling is disabled
    return (
        <label className={cssClass} style={styleObj}>
            <input
                type={multiple ? 'checkbox' : 'radio'}
                checked={checked}
                disabled={disabled}
                readOnly
                style={{ marginRight: '8px' }}
            />
            <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: checked ? '#e3f2fd' : '#f5f5f5',
                border: `1px solid ${checked ? '#2196f3' : '#ddd'}`,
                fontSize: '0.875rem'
            }}>
                {label}
            </span>
        </label>
    );
};

export default ChipStyle;

