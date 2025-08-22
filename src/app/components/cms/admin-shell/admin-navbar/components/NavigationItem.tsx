'use client';

import { 
    UnstyledButton, 
    Group, 
    Text, 
    Badge,
    Box,
    Tooltip
} from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useNavigationStore } from '../../../../../store/navigation.store';

interface INavigationItemProps {
    label: string;
    href: string;
    icon?: React.ReactNode;
    badge?: {
        text: string;
        color: string;
    };
    description?: string;
    onClick?: () => void;
}

export function NavigationItem({ 
    label, 
    href, 
    icon, 
    badge, 
    description,
    onClick 
}: INavigationItemProps) {
    const router = useRouter();
    const { setActiveItem, activeItem } = useNavigationStore();
    
    const isActive = activeItem === href;

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            setActiveItem(href);
            router.push(href);
        }
    };

    const content = (
        <UnstyledButton
            onClick={handleClick}
            w="100%"
            px="xs"
            py={2}
            style={{
                borderRadius: 'var(--mantine-radius-xs)',
                transition: 'all 0.15s ease',
                backgroundColor: isActive ? 'var(--mantine-color-blue-0)' : 'transparent',
                border: '1px solid transparent',
                borderColor: isActive ? 'var(--mantine-color-blue-4)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--mantine-color-blue-6)' : '3px solid var(--mantine-color-gray-3)',
                position: 'relative',
                marginLeft: '12px', // Space for tree line
                minHeight: '20px'
            }}
            styles={{
                root: {
                    '&:hover': {
                        backgroundColor: isActive 
                            ? 'var(--mantine-color-blue-0)' 
                            : 'var(--mantine-color-gray-0)',
                        borderColor: isActive 
                            ? 'var(--mantine-color-blue-4)' 
                            : 'var(--mantine-color-gray-3)',
                        borderLeftColor: isActive 
                            ? 'var(--mantine-color-blue-6)' 
                            : 'var(--mantine-color-gray-4)'
                    },
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: '-12px',
                        top: '50%',
                        width: '8px',
                        height: '1px',
                        backgroundColor: 'var(--mantine-color-gray-3)',
                        transform: 'translateY(-50%)'
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: '-12px',
                        top: '0',
                        bottom: '50%',
                        width: '1px',
                        backgroundColor: 'var(--mantine-color-gray-3)'
                    }
                }
            }}
            data-active={isActive || undefined}
        >
            <Group gap="xs" wrap="nowrap">
                <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text 
                        size="xs" 
                        fw={isActive ? 600 : 400}
                        truncate
                        c={isActive ? 'blue.6' : 'gray.7'}
                    >
                        {label}
                    </Text>
                    {description && (
                        <Text size="xs" c="dimmed" truncate>
                            {description}
                        </Text>
                    )}
                </Box>
                {badge && (
                    <Badge size="xs" variant="light" color={badge.color}>
                        {badge.text}
                    </Badge>
                )}
            </Group>
        </UnstyledButton>
    );

    if (description && !badge) {
        return (
            <Tooltip label={description} position="right" withArrow>
                {content}
            </Tooltip>
        );
    }

    return content;
}
