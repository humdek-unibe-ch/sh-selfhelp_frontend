'use client';

import { Box, Text } from '@mantine/core';

interface ICategoryHeaderProps {
    title: string;
    count: number;
}

export function CategoryHeader({ title, count }: ICategoryHeaderProps) {
    const colors = { 
        bg: 'var(--mantine-color-gray-0)', 
        border: 'var(--mantine-color-gray-3)', 
        text: 'gray.7' 
    };

    return (
        <Box 
            px="xs" 
            py={1} 
            mb={1}
            style={{
                backgroundColor: colors.bg,
                borderLeft: `3px solid ${colors.border}`,
                borderRadius: 'var(--mantine-radius-xs)'
            }}
        >
            <Text size="xs" c={colors.text} fw={600} tt="uppercase">
                {title} ({count})
            </Text>
        </Box>
    );
}
