import React from 'react';
import { Switch, Input } from '@mantine/core';
import { getFieldContent, castMantineSize } from '../../../../../../utils/style-field-extractor';
import { ISwitchStyle } from '../../../../../../types/common/styles.types';

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
    const radius = castMantineSize(getFieldContent(style, 'mantine_radius'));
    const disabled = getFieldContent(style, 'disabled') === '1';
    const name = getFieldContent(style, 'name');
    const value = getFieldContent(style, 'value');
    const isRequired = getFieldContent(style, 'is_required') === '1';
    const labelPosition = getFieldContent(style, 'mantine_label_position') || 'top';
    const onValue = getFieldContent(style, 'mantine_switch_on_value') || '1';
    const useInputWrapper = getFieldContent(style, 'mantine_use_input_wrapper') === '1';

    // Determine if switch should be checked based on value comparison
    const isChecked = value === onValue;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Create the Switch component
    const switchElement = (
        <Switch
            value={value}
            defaultChecked={isChecked}
            name={name}
            required={isRequired}
            onLabel={onLabel}
            offLabel={offLabel}
            size={size}
            color={color}
            radius={radius}
            disabled={disabled}
            className={cssClass}
            style={styleObj}
            labelPosition={labelPosition as 'left' | 'right'}
            label={ useInputWrapper ? undefined : label}
            description={useInputWrapper ? undefined : description}
        />
    );

    // Conditionally use Input.Wrapper based on mantine_use_input_wrapper field
    if (useInputWrapper) {
        return (
            <Input.Wrapper
                label={label}
                description={description}
                required={isRequired}
            >
                {switchElement}
            </Input.Wrapper>
        );
    }

   return switchElement;
};

export default SwitchStyle;
