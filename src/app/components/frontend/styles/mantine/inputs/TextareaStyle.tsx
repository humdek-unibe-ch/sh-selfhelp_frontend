/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState, useContext } from 'react';
import { Textarea, Input } from '@mantine/core';
import IconComponent from '../../../../shared/common/IconComponent';
import { type ITextareaStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';
import { castMantineSize, castMantineRadius } from '../../../../../../utils/style-field-extractor';
import LanguageTabsWrapper from '../../shared/LanguageTabsWrapper';
import { getSpacingProps } from '../../BasicStyle';
import DOMPurify from 'isomorphic-dompurify';

interface ITextareaStyleProps {
    style: ITextareaStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

const TextareaStyle: React.FC<ITextareaStyleProps> = ({ style, styleProps, cssClass }) => {
    const name = style.name?.content;
    const translatable = style.translatable?.content === '1';

    // Handle CSS field - use direct property from API response

    const label = style.label?.content;
    const description = style.description?.content || '';
    const placeholder =
    DOMPurify.sanitize(style.placeholder?.content ?? "", {
        ALLOWED_TAGS: [],
    });
    const initialValue = style.value?.content;
    const required = style.is_required?.content === '1';
    const disabled = style.disabled?.content === '1';
    const leftIconName = style.web_left_icon?.content;
    const rightIconName = style.web_right_icon?.content;
    const autosize = style.shared_autosize?.content === '1';
    const minRows = parseInt(style.shared_min_rows?.content || '3');
    const maxRows = parseInt(style.shared_max_rows?.content || '8');
    const resize = style.web_textarea_resize?.content as 'none' | 'vertical' | 'both';
    const size = castMantineSize(style.shared_size?.content);
    const radius = castMantineRadius(style.shared_radius?.content);
    const variant = style.web_textarea_variant?.content;

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Use form value if available, otherwise use initial value from style
    const [value, setValue] = useState<string | Array<{ language_id: number; value: string }> | null>(formValue || initialValue || '');

    // Keep state in sync with the (async) form value via a render-phase update
    // instead of an effect; the sentinel initial runs it on first render too.
    const [prevFormValue, setPrevFormValue] = useState<unknown>(() => ({}));
    if (prevFormValue !== formValue) {
        setPrevFormValue(formValue);
        if (formValue !== null) {
            setValue(formValue);
        }
    }

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
    const renderTextarea = (_language: unknown, currentValue: string, onValueChange: (value: string) => void) => {
        const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            onValueChange(event.target.value);
        };

        return (
            <Input.Wrapper
                label={DOMPurify.sanitize(label || '', { ALLOWED_TAGS: [] })}
                description={parse(sanitizeHtmlForParsing(description))}
                required={required}
                className={translatable ? undefined : cssClass}
                {...(translatable ? undefined : { ...styleProps, ...spacingProps })}
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
                    // See note in TextInputStyle — autofill extensions decorate
                    // form fields before hydration.
                    suppressHydrationWarning
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
            className={translatable ? cssClass : undefined}
            styleProps={translatable ? { ...styleProps, ...spacingProps } : styleProps}
        >
            {renderTextarea}
        </LanguageTabsWrapper>
    );
};

export default TextareaStyle;
