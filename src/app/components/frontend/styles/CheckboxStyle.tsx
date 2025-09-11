import React from 'react';
import { Checkbox } from '@mantine/core';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../utils/style-field-extractor';
import { ICheckboxStyle } from '../../../../types/common/styles.types';

interface ICheckboxStyleProps {
    style: ICheckboxStyle;
}

const CheckboxStyle: React.FC<ICheckboxStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label');
    const name = getFieldContent(style, 'name');
    const value = getFieldContent(style, 'value');
    const checkboxValue = getFieldContent(style, 'checkbox_value') || '1';
    const isRequired = getFieldContent(style, 'is_required') === '1';
    const checked = getFieldContent(style, 'mantine_checkbox_checked') === '1';
    const indeterminate = getFieldContent(style, 'mantine_checkbox_indeterminate') === '1';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Checkbox
                label={label}
                name={name}
                value={checkboxValue}
                checked={checked}
                indeterminate={indeterminate}
                required={isRequired}
                size={size}
                radius={radius === 'none' ? 0 : radius}
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
                name={name}
                value={checkboxValue}
                checked={checked}
                required={isRequired}
                disabled={disabled}
                style={{ marginRight: '8px' }}
            />
            {label}
        </label>
    );
};

export default CheckboxStyle; 