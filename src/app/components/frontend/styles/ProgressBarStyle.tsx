import React from 'react';
import { Box, Progress, Text, Group } from '@mantine/core';
import { IProgressBarStyle } from '../../../../types/common/styles.types';

interface IProgressBarStyleProps {
    style: IProgressBarStyle;
}

const ProgressBarStyle: React.FC<IProgressBarStyleProps> = ({ style }) => {
    const type = style.type?.content || 'blue';
    const count = parseInt(style.count?.content || '0');
    const countMax = parseInt(style.count_max?.content || '100');
    const isStriped = style.is_striped?.content === '1';
    const hasLabel = style.has_label?.content === '1';
    
    // Calculate progress percentage
    const progress = countMax > 0 ? (count / countMax) * 100 : 0;

    // Map legacy type to Mantine color
    const getColor = (type: string): string => {
        const colorMap: { [key: string]: string } = {
            'primary': 'blue',
            'secondary': 'gray',
            'success': 'green',
            'danger': 'red',
            'warning': 'yellow',
            'info': 'cyan',
            'light': 'gray',
            'dark': 'dark'
        };
        return colorMap[type] || type;
    };

    return (
        <Box className={style.css ?? ""}>
            {hasLabel && (
                <Group justify="space-between" mb="xs">
                    <Text size="sm">Progress</Text>
                    <Text size="sm" c="dimmed">
                        {count}/{countMax}
                    </Text>
                </Group>
            )}
            <Progress
                value={progress}
                color={getColor(type)}
                striped={isStriped}
                animated={isStriped}
                size="md"
            />
        </Box>
    );
};

export default ProgressBarStyle; 