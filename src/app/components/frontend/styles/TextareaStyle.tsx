import React from 'react';
import { Textarea } from '@mantine/core';
import { ITextareaStyle } from '../../../../types/common/styles.types';
import { getFieldContent, hasFieldValue, castMantineSize, castMantineRadius } from '../../../../utils/style-field-extractor';

interface TextareaStyleProps {
    style: ITextareaStyle;
}

const TextareaStyle: React.FC<TextareaStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const name = getFieldContent(style, 'name');
    const label = getFieldContent(style, 'label');
    const placeholder = getFieldContent(style, 'placeholder');
    const value = getFieldContent(style, 'value');
    const minLength = getFieldContent(style, 'min');
    const maxLength = getFieldContent(style, 'max');
    const rows = parseInt(getFieldContent(style, 'mantine_textarea_rows') || '4');
    const resize = getFieldContent(style, 'mantine_textarea_resize') || 'vertical';
    const isRequired = hasFieldValue(style, 'is_required');
    const isLocked = hasFieldValue(style, 'locked_after_submit');
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const variant = getFieldContent(style, 'mantine_variant') || 'default';
    const disabled = hasFieldValue(style, 'disabled');
    const use_mantine_style = hasFieldValue(style, 'use_mantine_style');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Textarea
                name={name}
                label={label}
                placeholder={placeholder}
                defaultValue={value}
                required={isRequired}
                disabled={disabled || isLocked}
                rows={rows}
                resize={resize as 'none' | 'vertical' | 'horizontal' | 'both'}
                size={size}
                radius={radius === 'none' ? 0 : radius}
                variant={variant as any}
                className={cssClass}
                style={styleObj}
                minLength={minLength ? parseInt(minLength) : undefined}
                maxLength={maxLength ? parseInt(maxLength) : undefined}
            />
        );
    }

    // Fallback to basic textarea when Mantine styling is disabled
    return (
        <div className={cssClass} style={styleObj}>
            {label && (
                <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                }}>
                    {label}
                    {isRequired && <span style={{ color: 'red' }}> *</span>}
                </label>
            )}
            <textarea
                name={name}
                placeholder={placeholder}
                defaultValue={value}
                required={isRequired}
                disabled={disabled || isLocked}
                rows={rows}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    resize: resize as any,
                    fontFamily: 'inherit',
                    fontSize: '14px'
                }}
                minLength={minLength ? parseInt(minLength) : undefined}
                maxLength={maxLength ? parseInt(maxLength) : undefined}
            />
        </div>
    );
};

export default TextareaStyle;