'use client';

import { 
    Group, 
    Button, 
    Title, 
    Badge,
    Box
} from '@mantine/core';

export interface IInspectorButton {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'filled' | 'outline' | 'subtle';
    color?: string;
    disabled?: boolean;
    loading?: boolean;
}

interface IInspectorHeaderProps {
    inspectorType?: 'page' | 'section' | null;
    inspectorTitle?: string;
    inspectorId?: string | number;
    inspectorButtons?: IInspectorButton[];
}

export function InspectorHeader({
    inspectorType,
    inspectorTitle,
    inspectorId,
    inspectorButtons = []
}: IInspectorHeaderProps) {
    if (!inspectorType || !inspectorTitle) {
        return null;
    }

    return (
        <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Group gap="xs" align="center" wrap="nowrap" mb="md">
                <Group gap="xs" align="center">
                    <Title order={6} size="sm">
                        {inspectorTitle}
                    </Title>
                    {inspectorId && (
                        <Badge size="xs" variant="light" color={inspectorType === 'page' ? 'blue' : 'green'}>
                            ID: {inspectorId}
                        </Badge>
                    )}
                </Group>
            </Group>

            {inspectorButtons.length > 0 && (
                <Group gap="xs" align="center" wrap="wrap">
                    {inspectorButtons.map((button) => (
                        <Button
                            key={button.id}
                            leftSection={button.icon}
                            onClick={button.onClick}
                            variant={button.variant || 'outline'}
                            color={button.color}
                            disabled={button.disabled}
                            loading={button.loading}
                            size="sm"
                        >
                            {button.label}
                        </Button>
                    ))}
                </Group>
            )}
        </Box>
    );
}