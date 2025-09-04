import React from 'react';
import { Box, Slider, Text, Group } from '@mantine/core';
import { ISliderStyle } from '../../../../types/common/styles.types';

interface ISliderStyleProps {
    style: ISliderStyle;
}

const SliderStyle: React.FC<ISliderStyleProps> = ({ style }) => {
    const label = style.label?.content;
    const name = style.name?.content;
    const value = parseInt(style.value?.content || '0');
    const min = parseInt(style.min?.content || '0');
    const max = parseInt(style.max?.content || '100');
    const isLocked = style.locked_after_submit?.content === '1';

    // Parse labels - handle both array and JSON string formats
    let labels: any[] = [];
    try {
        const labelsContent = style.labels?.content;
        if (Array.isArray(labelsContent)) {
            labels = labelsContent;
        } else if (labelsContent && typeof labelsContent === 'string') {
            const stringContent = labelsContent as string;
            if (stringContent.trim()) {
                labels = JSON.parse(stringContent);
            }
        }
    } catch (error) {

        labels = [];
    }

    // Create marks from labels if available
    const marks = labels.length > 0 ? labels.map((labelItem: any, index: number) => ({
        value: min + (index * (max - min) / (labels.length - 1)),
        label: labelItem.text || labelItem.label || labelItem
    })) : [];

    return (
        <Box className={style.css ?? ""}>
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
                marks={marks}
                disabled={isLocked}
                size="md"
                mb="md"
            />
            
            <Group justify="space-between" mt="xs">
                <Text size="xs" c="dimmed">{min}</Text>
                <Text size="xs" c="dimmed">{max}</Text>
            </Group>
        </Box>
    );
};

export default SliderStyle; 