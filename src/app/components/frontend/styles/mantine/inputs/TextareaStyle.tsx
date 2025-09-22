import React, { useState, useEffect, useContext } from 'react';
import { Textarea, Input } from '@mantine/core';
import { castMantineRadius, castMantineSize, getFieldContent } from '../../../../../../utils/style-field-extractor';
import IconComponent from '../../../../shared/common/IconComponent';
import { ITextareaStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';

interface ITextareaStyleProps {
    style: ITextareaStyle;
}

const TextareaStyle: React.FC<ITextareaStyleProps> = ({ style }) => {
    // Extract field values
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    const name = getFieldContent(style, 'name');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const placeholder = getFieldContent(style, 'placeholder');
    const initialValue = getFieldContent(style, 'value');
    const required = getFieldContent(style, 'is_required') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const leftIconName = getFieldContent(style, 'mantine_left_icon');
    const rightIconName = getFieldContent(style, 'mantine_right_icon');
    const autosize = getFieldContent(style, 'mantine_textarea_autosize') === '1';
    const minRows = parseInt(getFieldContent(style, 'mantine_textarea_min_rows') || '3');
    const maxRows = parseInt(getFieldContent(style, 'mantine_textarea_max_rows') || '8');
    const resize = getFieldContent(style, 'mantine_textarea_resize') as 'none' | 'vertical' | 'both';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const variant = getFieldContent(style, 'mantine_textarea_variant');

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

    const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(event.target.value);
    };

    // Fallback: Render basic textarea with only CSS and name when Mantine styling is disabled
    if (!use_mantine_style) {
        return (
            <textarea
                name={name}
                className={cssClass}
                value={value}
                onChange={onChange}
                disabled={disabled}
                rows={minRows}
                required={required}
                placeholder={placeholder}
            />
        );
    }


    return (
        <Input.Wrapper
            label={label}
            description={parse(sanitizeHtmlForParsing(description))}
            required={required}
            className={cssClass}
        >
            <Textarea
                placeholder={placeholder}
                required={required}
                value={value}
                name={name}
                onChange={onChange}
                disabled={disabled}
                leftSection={leftSection}
                rightSection={rightSection}
                autosize={autosize}
                minRows={minRows}
                maxRows={maxRows}
                resize={resize}
                size={size}
                variant={variant as 'default' | 'filled' | 'unstyled'}
                radius={radius === 'none' ? 0 : radius}
            />
        </Input.Wrapper>
    );
};

export default TextareaStyle;
