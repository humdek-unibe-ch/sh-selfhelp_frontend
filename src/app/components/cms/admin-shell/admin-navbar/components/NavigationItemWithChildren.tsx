'use client';

import { 
    UnstyledButton, 
    Group, 
    Text, 
    Badge,
    Box,
    Tooltip,
    Collapse,
    Stack,
    ActionIcon
} from '@mantine/core';
import { IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationStore } from '../../../../../store/navigation.store';

interface INavigationItemWithChildrenProps {
    label: string;
    href: string;
    icon?: React.ReactNode;
    badge?: {
        text: string;
        color: string;
    };
    description?: string;
    onClick?: () => void;
    children?: INavigationItemWithChildrenProps[];
    level?: number;
}

export function NavigationItemWithChildren({ 
    label, 
    href, 
    icon, 
    badge, 
    description,
    onClick,
    children = [],
    level = 0
}: INavigationItemWithChildrenProps) {
    const router = useRouter();
    const { setActiveItem, activeItem } = useNavigationStore();
    const [isExpanded, setIsExpanded] = useState(false);
    
    const isActive = activeItem === href;
    const hasChildren = children.length > 0;

    const handleClick = useCallback(() => {
        if (onClick) {
            onClick();
        } else {
            setActiveItem(href);
            router.push(href);
        }
        
        // If has children, toggle expansion
        if (hasChildren) {
            setIsExpanded(prev => !prev);
        }
    }, [onClick, href, setActiveItem, router, hasChildren]);

    const handleToggleExpand = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    }, []);

    const leftPadding = 12 + (level * 16); // Increase indentation for each level

    const content = (
        <Box>
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
                    marginLeft: `${leftPadding}px`,
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
                        }
                    }
                }}
                data-active={isActive || undefined}
            >
                <Group gap="xs" wrap="nowrap">
                    {hasChildren && (
                        <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="gray"
                            onClick={handleToggleExpand}
                            style={{ flexShrink: 0 }}
                        >
                            {isExpanded ? (
                                <IconChevronDown size={12} />
                            ) : (
                                <IconChevronRight size={12} />
                            )}
                        </ActionIcon>
                    )}
                    
                    {icon && (
                        <Box style={{ flexShrink: 0 }}>
                            {icon}
                        </Box>
                    )}
                    
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

            {/* Render children with collapse animation */}
            {hasChildren && (
                <Collapse in={isExpanded}>
                    <Stack gap={1} mt={2}>
                        {children.map((child, index) => (
                            <NavigationItemWithChildren
                                key={`${child.href}-${index}`}
                                {...child}
                                level={level + 1}
                            />
                        ))}
                    </Stack>
                </Collapse>
            )}
        </Box>
    );

    if (description && !badge && !hasChildren) {
        return (
            <Tooltip label={description} position="right" withArrow>
                {content}
            </Tooltip>
        );
    }

    return content;
}
