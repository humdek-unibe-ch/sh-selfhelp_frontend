import React, { useState, useEffect, useContext } from 'react';
import { Textarea, Input } from '@mantine/core';
import IconComponent from '../../../../shared/common/IconComponent';
import { ITextareaStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';
import { castMantineSize, castMantineRadius } from '../../../../../../utils/style-field-extractor';
import LanguageTabsWrapper from '../../shared/LanguageTabsWrapper';
import { getSpacingProps } from '../../BasicStyle';

interface ITextareaStyleProps {
    style: ITextareaStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

const TextareaStyle: React.FC<ITextareaStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values
    const use_mantine_style = style.use_mantine_style?.content === '1';

    const name = style.name?.content;
    const translatable = style.translatable?.content === '1';

    // Handle CSS field - use direct property from API response

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
    const [value, setValue] = useState<string | Array<{ language_id: number; value: string }> | null>(formValue || initialValue || '');

    // Update value when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            setValue(formValue);
        }
    }, [formValue]);

    // Handle value change - for LanguageTabsWrapper
    const handleValueChange = (fieldName: string, newValue: string | Array<{ language_id: number; value: string }> | null) => {
        // Update local state
        setValue(newValue);
        // The LanguageTabsWrapper handles the actual form submission via hidden inputs
    };

    // Extract spacing props
    const spacingProps = getSpacingProps(style);

    // Extract section content and convert to React nodes
    const leftSection = leftIconName ? <IconComponent iconName={leftIconName} size={16} /> : undefined;
    const rightSection = rightIconName ? <IconComponent iconName={rightIconName} size={16} /> : undefined;

    // Render textarea for a specific language
    const renderTextarea = (language: any, currentValue: string, onValueChange: (value: string) => void) => {
        const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            onValueChange(event.target.value);
        };

        // Fallback: Render basic textarea with only CSS and name when Mantine styling is disabled
        if (!use_mantine_style) {
            return (
                <textarea
                    name={translatable ? undefined : name} // Don't set name for translatable fields - handled by wrapper
                    className={cssClass}
                    value={currentValue}
                    onChange={handleChange}
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
                {...styleProps}
            >
                <Textarea
                    placeholder={placeholder}
                    required={required}
                    value={currentValue}
                    name={translatable ? undefined : name} // Don't set name for translatable fields - handled by wrapper
                    onChange={handleChange}
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

    return (
        <LanguageTabsWrapper
            translatable={translatable}
            name={name || ''}
            value={value}
            onChange={handleValueChange}
            className={cssClass}
            styleProps={{ ...styleProps, ...spacingProps }}
        >
            {renderTextarea}
        </LanguageTabsWrapper>
    );
};

export default TextareaStyle;
