import React, { useState, useEffect, useContext } from 'react';
import { TextInput, Input } from '@mantine/core';
import IconComponent from '../../../../shared/common/IconComponent';
import { ITextInputStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import { castMantineSize, castMantineRadius } from '../../../../../../utils/style-field-extractor';

/**
 * Props interface for ITextInputStyle component
 */
interface ITextInputStyleProps {
    style: ITextInputStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

const TextInputStyle: React.FC<ITextInputStyleProps> = ({ style, styleProps, cssClass }) => {

    // Extract field values
    const label = style.label?.content;
    const description = style.description?.content;
    const placeholder = style.placeholder?.content;
    const initialValue = style.value?.content;
    const name = style.name?.content;
    const required = style.is_required?.content === '1';
    const disabled = style.disabled?.content === '1';
    const leftIconName = style.mantine_left_icon?.content;
    const rightIconName = style.mantine_right_icon?.content;
    const size = castMantineSize((style as any).mantine_size?.content);
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const variant = style.mantine_text_input_variant?.content;

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
    

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    };

    return (
        <TextInput
            {...styleProps} className={cssClass}
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
