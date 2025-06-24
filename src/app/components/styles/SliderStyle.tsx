import React from 'react';
import type { ISliderStyle } from '../../../types/common/styles.types';
import { Box, Slider, Text, Group } from '@mantine/core';

interface ISliderStyleProps {
    style: ISliderStyle;
}

const SliderStyle: React.FC<ISliderStyleProps> = ({ style }) => {
    const label = style.label?.content;
    const name = style.name?.content;
    const value = parseInt(style.value?.content || '0');
    const labels = style.labels?.content || [];
    const min = parseInt(style.min?.content || '0');
    const max = parseInt(style.max?.content || '100');
    const isLocked = style.locked_after_submit?.content === '1';

    // Create marks from labels if available
    const marks = labels.length > 0 ? labels.map((labelItem: any, index: number) => ({
        value: min + (index * (max - min) / (labels.length - 1)),
        label: labelItem.text || labelItem.label || labelItem
    })) : [];

    return (
        <Box className={style.css}>
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