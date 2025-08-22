'use client';

import { useState } from 'react';
import { 
    Box, 
    Collapse, 
    Group, 
    Text, 
    ThemeIcon, 
    UnstyledButton,
    Stack,
    Badge
} from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useNavigationStore } from '../../../../../store/navigation.store';
import { usePathname } from 'next/navigation';
import { NavigationItem } from './NavigationItem';

interface INavigationLink {
    label: string;
    href: string;
    icon?: React.ReactNode;
    badge?: {
        text: string;
        color: string;
    };
    description?: string;
}

interface INavigationSectionProps {
    title: string;
    icon: React.ReactNode;
    links?: INavigationLink[];
    children?: React.ReactNode;
    initiallyOpen?: boolean;
    rightSection?: React.ReactNode;
    directLink?: string;
    itemCount?: number;
}

export function NavigationSection({ 
    title, 
    icon, 
    links, 
    children, 
    initiallyOpen = false,
    rightSection,
    directLink,
    itemCount
}: INavigationSectionProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { toggleItem, setActiveItem, openItems, activeItem } = useNavigationStore();
    
    const isOpen = openItems.includes(title) || initiallyOpen;
    
    // Check if this section or any of its children are active
    const isDirectlyActive = activeItem === directLink;
    const hasActiveChild = links?.some(link => activeItem === link.href) || false;
    const isActive = isDirectlyActive || hasActiveChild;
    
    const hasContent = (links && links.length > 0) || children;

    const handleSectionClick = () => {
        if (directLink) {
            setActiveItem(directLink);
            router.push(directLink);
        } else if (hasContent) {
            toggleItem(title);
        }
    };

    return (
        <Box>
            <UnstyledButton
                onClick={handleSectionClick}
                w="100%"
                px="xs"
                py={2}
                style={{
                    borderRadius: 'var(--mantine-radius-sm)',
                    transition: 'all 0.15s ease',
                    backgroundColor: isActive ? 'var(--mantine-color-blue-light)' : 'transparent',
                    border: '1px solid transparent',
                    borderColor: isActive ? 'var(--mantine-color-blue-4)' : 'transparent'
                }}
                styles={{
                    root: {
                        '&:hover': {
                            backgroundColor: isActive 
                                ? 'var(--mantine-color-blue-light)' 
                                : 'var(--mantine-color-gray-0)',
                            borderColor: isActive 
                                ? 'var(--mantine-color-blue-4)' 
                                : 'var(--mantine-color-gray-3)'
                        }
                    }
                }}
                data-active={isActive || undefined}
            >
                <Group justify="space-between" gap="xs" wrap="nowrap">
                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                        <ThemeIcon 
                            variant="light" 
                            size="sm"
                            color={isActive ? 'blue' : 'gray'}
                        >
                            {icon}
                        </ThemeIcon>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text 
                                size="sm" 
                                fw={500} 
                                truncate
                                c={isActive ? 'blue' : undefined}
                            >
                                {title}
                            </Text>
                            {itemCount !== undefined && itemCount > 0 && (
                                <Text size="xs" c="dimmed">
                                    {itemCount} items
                                </Text>
                            )}
                        </Box>
                    </Group>
                    
                    <Group gap="xs">
                        {rightSection && (
                            <div 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                style={{ display: 'flex' }}
                            >
                                {rightSection}
                            </div>
                        )}
                        {hasContent && (
                            <IconChevronRight
                                size={16}
                                style={{
                                    transform: isOpen ? 'rotate(90deg)' : 'none',
                                    transition: 'transform 0.15s ease',
                                    color: 'var(--mantine-color-gray-6)'
                                }}
                            />
                        )}
                    </Group>
                </Group>
            </UnstyledButton>
            
            {hasContent && (
                <Collapse in={isOpen}>
                    <Box pl="sm" pt="xs" pb="xs">
                        <Stack gap={1}>
                            {links && links.map((link) => (
                                <NavigationItem
                                    key={link.href}
                                    label={link.label}
                                    href={link.href}
                                    icon={link.icon}
                                    badge={link.badge}
                                    description={link.description}
                                />
                            ))}
                            {children}
                        </Stack>
                    </Box>
                </Collapse>
            )}
        </Box>
    );
}
