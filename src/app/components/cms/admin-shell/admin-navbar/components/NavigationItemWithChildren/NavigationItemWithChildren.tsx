'use client';

import {
    Group,
    Text,
    Box,
    Collapse,
    Stack,
    ActionIcon
} from '@mantine/core';
import { IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './NavigationItemWithChildren.module.css';
import { useNavigationStore } from '../../../../../../store/navigation.store';

interface INavigationItemWithChildrenProps {
    label: string;
    href: string;
    children?: INavigationItemWithChildrenProps[];
    level?: number;
}

export function NavigationItemWithChildren({
    label,
    href,
    children = [],
    level = 0
}: INavigationItemWithChildrenProps) {
    const router = useRouter();
    const { setActiveItem, activeItem } = useNavigationStore();
    const [isExpanded, setIsExpanded] = useState(false);

    const isActive = activeItem === href;
    const hasChildren = children.length > 0;

    // Check if any child is active to auto-expand parent
    const hasActiveChild = children.some(child =>
        activeItem === child.href ||
        (child.children && child.children.some(grandchild => activeItem === grandchild.href))
    );

    // Auto-expand if this item or any child is active
    useEffect(() => {
        if (isActive || hasActiveChild) {
            setIsExpanded(true);
        }
    }, [isActive, hasActiveChild]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        // Support middle click and ctrl+click for new tab
        if (e.button === 1 || e.ctrlKey || e.metaKey) {
            window.open(href, '_blank');
            return;
        }

        // If has children, toggle expansion
        if (hasChildren) {
            setIsExpanded(prev => !prev);
        } else {
            // Navigate to the item
            setActiveItem(href);
            router.push(href);
        }
    }, [hasChildren, href, router, setActiveItem]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        // Allow right-click context menu for "open in new tab"
        e.stopPropagation();
    }, []);

    const handleToggleExpand = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    }, []);

    return (
        <Box>
            <Box
                className={styles.navItem}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                px="xs"
                py={2}
                data-active={isActive || undefined}
            >
                <Group gap="xs" wrap="nowrap">
                    {hasChildren && (
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={handleToggleExpand}
                            className={styles.chevronButton}
                        >
                            {isExpanded ? (
                                <IconChevronDown size={12} color="var(--mantine-color-gray-6)" />
                            ) : (
                                <IconChevronRight size={12} color="var(--mantine-color-gray-6)" />
                            )}
                        </ActionIcon>
                    )}

                    <Box className={styles.navItemText}>
                        <Text
                            size="xs"
                            fw={isActive ? 600 : 400}
                            truncate
                            c={isActive ? 'blue.6' : 'gray.7'}
                        >
                            {label}
                        </Text>
                    </Box>
                </Group>
            </Box>

            {/* Children */}
            {hasChildren && (
                <Collapse in={isExpanded}>
                    <Stack gap={0} ml="md">
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
}
