import React from 'react';
import { Radio } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IRadioStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for RadioStyle component
 */
interface IRadioStyleProps {
    style: IRadioStyle;
}

/**
 * RadioStyle component renders a Mantine Radio component for individual radio buttons.
 * Typically used as children within RadioGroupStyle.
 *
 * @component
 * @param {IRadioStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Radio component
 */
const RadioStyle: React.FC<IRadioStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Radio
                value={style.id.toString()} // Use style ID as value
                label={label}
                description={description}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    // Fallback to basic radio input when Mantine styling is disabled
    return (
        <label className={cssClass} style={styleObj}>
            <input
                type="radio"
                name={`radio-${style.id}`}
                value={style.id.toString()}
                disabled={disabled}
            />
            {label}
            {description && <span style={{ fontSize: '0.875em', color: '#666' }}>{description}</span>}
        </label>
    );
};

export default RadioStyle;

