import React, { useState, useEffect, useContext } from 'react';
import { Textarea, Input } from '@mantine/core';
import IconComponent from '../../../../shared/common/IconComponent';
import { ITextareaStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';
import { castMantineSize, castMantineRadius } from '../../../../../../utils/style-field-extractor';

interface ITextareaStyleProps {
    style: ITextareaStyle;
}

const TextareaStyle: React.FC<ITextareaStyleProps> = ({ style }) => {
    // Extract field values
    const use_mantine_style = style.use_mantine_style?.content === '1';

    const name = style.name?.content;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    const label = style.label?.content;
    const description = style.description?.content || '';
    const placeholder = style.placeholder?.content;
    const initialValue = style.value?.content;
    const required = style.is_required?.content === '1';
    const disabled = style.disabled?.content === '1';
    const leftIconName = style.mantine_left_icon?.content;
    const rightIconName = style.mantine_right_icon?.content;
    const autosize = style.mantine_textarea_autosize?.content === '1';
    const minRows = parseInt((style as any).mantine_textarea_min_rows?.content || '3');
    const maxRows = parseInt((style as any).mantine_textarea_max_rows?.content || '8');
    const resize = style.mantine_textarea_resize?.content as 'none' | 'vertical' | 'both';
    const size = castMantineSize((style as any).mantine_size?.content);
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const variant = style.mantine_textarea_variant?.content;

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
