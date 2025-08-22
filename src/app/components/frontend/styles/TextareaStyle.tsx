import React from 'react';
import { Textarea } from '@mantine/core';
import { ITextareaStyle } from '../../../../types/common/styles.types';
import { getFieldContent, hasFieldValue } from '../../../../utils/style-field-extractor';

interface TextareaStyleProps {
    style: ITextareaStyle;
}

const TextareaStyle: React.FC<TextareaStyleProps> = ({ style }) => {
    const name = getFieldContent(style, 'name');
    const label = getFieldContent(style, 'label');
    const placeholder = getFieldContent(style, 'placeholder');
    const value = getFieldContent(style, 'value');
    const minLength = getFieldContent(style, 'min');
    const maxLength = getFieldContent(style, 'max');
    const cssClass = getFieldContent(style, 'css');
    const isRequired = hasFieldValue(style, 'is_required');
    const isLocked = hasFieldValue(style, 'locked_after_submit');

    return (
        <Textarea
            name={name}
            label={label}
            required={isRequired}
            placeholder={placeholder}
            rows={4}
            defaultValue={value}
            className={cssClass}
            disabled={isLocked}
            minLength={minLength ? parseInt(minLength) : undefined}
            maxLength={maxLength ? parseInt(maxLength) : undefined}
        />
    );
};

export default TextareaStyle;