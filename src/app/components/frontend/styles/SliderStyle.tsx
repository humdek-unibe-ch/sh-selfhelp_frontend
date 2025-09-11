import React from 'react';
import { Slider, Text, Group } from '@mantine/core';
import { getFieldContent, castMantineSize } from '../../../../utils/style-field-extractor';
import { ISliderStyle } from '../../../../types/common/styles.types';

interface ISliderStyleProps {
    style: ISliderStyle;
}

const SliderStyle: React.FC<ISliderStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label');
    const name = getFieldContent(style, 'name');
    const value = parseInt(getFieldContent(style, 'value') || '0');
    const min = parseInt(getFieldContent(style, 'mantine_numeric_min') || getFieldContent(style, 'min') || '0');
    const max = parseInt(getFieldContent(style, 'mantine_numeric_max') || getFieldContent(style, 'max') || '100');
    const step = parseInt(getFieldContent(style, 'mantine_numeric_step') || '1');
    const isLocked = getFieldContent(style, 'locked_after_submit') === '1';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Parse labels - handle both array and JSON string formats
    let labels: any[] = [];
    try {
        const labelsContent = getFieldContent(style, 'labels');
        if (labelsContent) {
            labels = JSON.parse(labelsContent);
        }
    } catch (error) {
        labels = [];
    }

    // Create marks from labels if available
    const marks = labels.length > 0 ? labels.map((labelItem: any, index: number) => ({
        value: min + (index * (max - min) / (labels.length - 1)),
        label: labelItem.text || labelItem.label || labelItem
    })) : [];

    if (use_mantine_style) {
        return (
            <div className={cssClass} style={styleObj}>
                {label && (
                    <Text size="sm" fw={500} mb="xs">
                        {label}
                    </Text>
                )}

                <Slider
                    name={name}
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    marks={marks}
                    size={size}
                    color={color}
                    disabled={disabled || isLocked}
                    mb="md"
                />

                <Group justify="space-between" mt="xs">
                    <Text size="xs" c="dimmed">{min}</Text>
                    <Text size="xs" c="dimmed">{max}</Text>
                </Group>
            </div>
        );
    }

    // Fallback to basic range input when Mantine styling is disabled
    return (
        <div className={cssClass} style={styleObj}>
            {label && (
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    {label}
                </div>
            )}

            <input
                type="range"
                name={name}
                value={value}
                min={min}
                max={max}
                step={step}
                disabled={disabled || isLocked}
                style={{ width: '100%', marginBottom: '16px' }}
            />

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                fontSize: '12px',
                color: '#666'
            }}>
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    );
};

export default SliderStyle; 