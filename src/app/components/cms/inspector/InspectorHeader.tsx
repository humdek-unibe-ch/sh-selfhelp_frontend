'use client';

import { memo } from 'react';
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

export const InspectorHeader = memo<IInspectorHeaderProps>(
    function InspectorHeader({
        inspectorType,
        inspectorTitle,
        inspectorId,
        inspectorButtons = []
    }) {
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
    },
    // Custom comparison for optimal performance
    (prevProps, nextProps) => {
        // Compare primitives
        if (prevProps.inspectorType !== nextProps.inspectorType ||
            prevProps.inspectorTitle !== nextProps.inspectorTitle ||
            prevProps.inspectorId !== nextProps.inspectorId) {
            return false;
        }

        // Compare buttons array
        const prevButtons = prevProps.inspectorButtons || [];
        const nextButtons = nextProps.inspectorButtons || [];
        
        if (prevButtons.length !== nextButtons.length) {
            return false;
        }

        // Compare each button's properties
        for (let i = 0; i < prevButtons.length; i++) {
            const prevButton = prevButtons[i];
            const nextButton = nextButtons[i];

            if (prevButton.id !== nextButton.id ||
                prevButton.label !== nextButton.label ||
                prevButton.variant !== nextButton.variant ||
                prevButton.color !== nextButton.color ||
                prevButton.disabled !== nextButton.disabled ||
                prevButton.loading !== nextButton.loading) {
                return false;
            }
        }

        return true; // Props are equal, don't re-render
    }
);
