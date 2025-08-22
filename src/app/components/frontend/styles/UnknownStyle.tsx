import React from 'react';
import { Paper, Text, Group, Badge, Code } from '@mantine/core';
import { IconQuestionMark } from '@tabler/icons-react';
import { TStyle } from '../../../../types/common/styles.types';

interface IUnknownStyleProps {
    style: TStyle;
}

/**
 * UnknownStyle component serves as a fallback for unrecognized style types.
 * It displays debugging information about the unknown style to help developers
 * identify and implement missing style components.
 */
const UnknownStyle: React.FC<IUnknownStyleProps> = ({ style }) => {
    return (
        <Paper 
            p="md" 
            withBorder 
            style={{ 
                borderColor: 'var(--mantine-color-orange-4)',
                backgroundColor: 'var(--mantine-color-orange-0)'
            }}
        >
            <Group gap="sm" mb="sm">
                <IconQuestionMark size={20} color="var(--mantine-color-orange-6)" />
                <Text fw={500} c="orange.6">Unknown Style Component</Text>
                <Badge color="orange" variant="light">
                    {style.style_name}
                </Badge>
            </Group>
            
            <Text size="sm" c="dimmed" mb="xs">
                This style type is not implemented yet. Please add a component for:
            </Text>
            
            <Code block c="orange.7">
                {JSON.stringify({ 
                    style_name: style.style_name,
                    id: style.id,
                    available_props: Object.keys(style).filter(key => key !== 'children')
                }, null, 2)}
            </Code>
        </Paper>
    );
};

export default UnknownStyle; 