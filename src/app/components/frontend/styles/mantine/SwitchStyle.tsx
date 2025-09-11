import React from 'react';
import { Switch } from '@mantine/core';
import { getFieldContent, castMantineSize } from '../../../../../utils/style-field-extractor';
import { ISwitchStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for SwitchStyle component
 */
interface ISwitchStyleProps {
    style: ISwitchStyle;
}

/**
 * SwitchStyle component renders a Mantine Switch component for toggle functionality.
 * Supports customizable labels, size, and color with on/off states.
 *
 * @component
 * @param {ISwitchStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Switch with styled configuration
 */
const SwitchStyle: React.FC<ISwitchStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label') || 'Switch';
    const description = getFieldContent(style, 'description');
    const onLabel = getFieldContent(style, 'mantine_switch_on_label') || 'On';
    const offLabel = getFieldContent(style, 'mantine_switch_off_label') || 'Off';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Switch
                label={label}
                description={description}
                onLabel={onLabel}
                offLabel={offLabel}
                size={size}
                color={color}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    // Fallback to basic checkbox when Mantine styling is disabled
    return (
        <label className={cssClass} style={styleObj}>
            <input
                type="checkbox"
                disabled={disabled}
                style={{ marginRight: '8px' }}
            />
            {label}
            {description && (
                <div style={{ fontSize: '0.875em', color: '#666', marginTop: '4px' }}>
                    {description}
                </div>
            )}
        </label>
    );
};

export default SwitchStyle;
