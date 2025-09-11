import React from 'react';
import { Radio } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent, castMantineSize } from '../../../../../utils/style-field-extractor';
import { IRadioGroupStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for RadioGroupStyle component
 */
interface IRadioGroupStyleProps {
    style: IRadioGroupStyle;
}

/**
 * RadioGroupStyle component renders a Mantine Radio.Group component with Radio children.
 * Supports vertical/horizontal orientation and multiple radio options.
 *
 * @component
 * @param {IRadioGroupStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Radio.Group with child radio components
 */
const RadioGroupStyle: React.FC<IRadioGroupStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label');
    const orientation = getFieldContent(style, 'mantine_orientation') || 'vertical';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Parse radio options from JSON textarea
    let radioOptions: Array<{ value: string; label: string }> = [];
    try {
        const optionsJson = getFieldContent(style, 'mantine_radio_options');
        if (optionsJson) {
            radioOptions = JSON.parse(optionsJson);
        }
    } catch (error) {
        console.warn('Invalid JSON in mantine_radio_options:', error);
        radioOptions = [];
    }

    if (use_mantine_style) {
        return (
            <Radio.Group
                label={label}
                className={cssClass}
                style={styleObj}
            >
                <div style={{
                    display: 'flex',
                    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
                    gap: 'var(--mantine-spacing-sm)'
                }}>
                    {radioOptions.map((option, index) => (
                        <Radio
                            key={index}
                            value={option.value}
                            label={option.label}
                            size={size}
                            color={color}
                            disabled={disabled}
                        />
                    ))}

                    {/* Render any child RadioStyle components */}
                    {children.map((child: any, index: number) => (
                        child ? <BasicStyle key={`child-${index}`} style={child} /> : null
                    ))}
                </div>
            </Radio.Group>
        );
    }

    // Fallback to basic radio group when Mantine styling is disabled
    return (
        <fieldset className={cssClass} style={styleObj} disabled={disabled}>
            {label && <legend>{label}</legend>}
            <div style={{
                display: 'flex',
                flexDirection: orientation === 'horizontal' ? 'row' : 'column',
                gap: '8px'
            }}>
                {radioOptions.map((option, index) => (
                    <label key={index}>
                        <input
                            type="radio"
                            name={`radio-group-${style.id}`}
                            value={option.value}
                            disabled={disabled}
                        />
                        {option.label}
                    </label>
                ))}

                {/* Render any child RadioStyle components */}
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={`child-${index}`} style={child} /> : null
                ))}
            </div>
        </fieldset>
    );
};

export default RadioGroupStyle;

