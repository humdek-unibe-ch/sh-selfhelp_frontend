import React from 'react';
import { Radio, Group, Text } from '@mantine/core';
import { getFieldContent, castMantineSize } from '../../../../utils/style-field-extractor';
import { IRadioStyle } from '../../../../types/common/styles.types';

interface IRadioStyleProps {
    style: IRadioStyle;
}

const RadioStyle: React.FC<IRadioStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label');
    const name = getFieldContent(style, 'name');
    const value = getFieldContent(style, 'value');
    const isRequired = getFieldContent(style, 'is_required') === '1';
    const isInline = getFieldContent(style, 'is_inline') === '1';
    const isLocked = getFieldContent(style, 'locked_after_submit') === '1';
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
        } else {
            // Fallback to legacy items field
            const itemsContent = getFieldContent(style, 'items');
            if (itemsContent) {
                radioOptions = JSON.parse(itemsContent);
            }
        }
    } catch (error) {
        console.warn('Invalid JSON in radio options:', error);
        radioOptions = [];
    }

    if (use_mantine_style) {
        return (
            <div className={cssClass} style={styleObj}>
                {label && (
                    <Text size="sm" fw={500} mb="xs">
                        {label}
                        {isRequired && <Text component="span" c="red"> *</Text>}
                    </Text>
                )}
                <Radio.Group
                    name={name}
                    value={value}
                    required={isRequired}
                >
                    <Group mt="xs" gap={isInline ? 'md' : 'xs'} align={isInline ? 'flex-start' : 'stretch'} style={{ flexDirection: isInline ? 'row' : 'column' }}>
                        {radioOptions.map((option, index) => (
                            <Radio
                                key={index}
                                value={option.value}
                                label={option.label}
                                size={size}
                                color={color}
                                disabled={disabled || isLocked}
                            />
                        ))}
                    </Group>
                </Radio.Group>
            </div>
        );
    }

    // Fallback to basic radio buttons when Mantine styling is disabled
    return (
        <div className={cssClass} style={styleObj}>
            {label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    {label}
                    {isRequired && <span style={{ color: 'red' }}> *</span>}
                </div>
            )}
            <div style={{
                display: 'flex',
                flexDirection: isInline ? 'row' : 'column',
                gap: isInline ? '16px' : '8px',
                marginTop: '8px'
            }}>
                {radioOptions.map((option, index) => (
                    <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            defaultChecked={value === option.value}
                            required={isRequired}
                            disabled={disabled || isLocked}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        </div>
    );
};

export default RadioStyle; 