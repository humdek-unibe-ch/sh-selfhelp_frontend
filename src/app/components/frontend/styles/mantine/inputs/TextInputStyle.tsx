import React, { useState, useEffect, useContext } from 'react';
import { TextInput, Input } from '@mantine/core';
import { castMantineRadius, castMantineSize, getFieldContent } from '../../../../../../utils/style-field-extractor';
import IconComponent from '../../../../shared/common/IconComponent';
import { ITextInputStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';

interface ITextInputStyleProps {
    style: ITextInputStyle;
}

const TextInputStyle: React.FC<ITextInputStyleProps> = ({ style }) => {

    // Extract field values
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const placeholder = getFieldContent(style, 'placeholder');
    const initialValue = getFieldContent(style, 'value');
    const name = getFieldContent(style, 'name');
    const required = getFieldContent(style, 'is_required') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const leftIconName = getFieldContent(style, 'mantine_left_icon');
    const rightIconName = getFieldContent(style, 'mantine_right_icon');
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const variant = getFieldContent(style, 'mantine_text_input_variant');

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Use form value if available, otherwise use initial value from style
    const [value, setValue] = useState(formValue || initialValue);

    // Update value when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            setValue(formValue);
        }
    }, [formValue]);

    // Extract section content and convert to React nodes
    const leftSection = leftIconName ? <IconComponent iconName={leftIconName} size={16} /> : undefined;
    const rightSection = rightIconName ? <IconComponent iconName={rightIconName} size={16} /> : undefined;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    };

    return (
        <TextInput
            className={cssClass}
            placeholder={placeholder}
            required={required}
            value={value}
            label={label}
            description={description}
            name={name}
            onChange={onChange}
            disabled={disabled}
            leftSection={leftSection}
            rightSection={rightSection}
            size={size}
            radius={radius === 'none' ? 0 : radius}
            variant={variant as 'default' | 'filled' | 'unstyled'}
        />
    );
};

export default TextInputStyle;
