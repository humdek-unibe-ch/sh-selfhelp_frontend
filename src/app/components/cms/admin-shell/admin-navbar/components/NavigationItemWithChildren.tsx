'use client';

import { 
    Group, 
    Text, 
    Box,
    Collapse,
    Stack
} from '@mantine/core';
import { IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationStore } from '../../../../../store/navigation.store';

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
        
        setActiveItem(href);
        router.push(href);
    }, [href, setActiveItem, router]);

    const handleToggleExpand = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    }, []);

    const leftPadding = 12 + (level * 16); // Increase indentation for each level

    const content = (
        <Box>
            {/* Use div instead of UnstyledButton to avoid nested buttons */}
            <div
                onClick={handleClick}
                onMouseDown={(e: React.MouseEvent) => {
                    // Handle middle click
                    if (e.button === 1) {
                        e.preventDefault();
                        window.open(href, '_blank');
                    }
                }}
                onContextMenu={(e: React.MouseEvent) => {
                    // Allow right-click context menu for "open in new tab"
                    e.stopPropagation();
                }}
                style={{
                    width: '100%',
                    padding: 'var(--mantine-spacing-xs)',
                    paddingTop: '2px',
                    paddingBottom: '2px',
                    borderRadius: 'var(--mantine-radius-xs)',
                    transition: 'all 0.15s ease',
                    backgroundColor: isActive ? 'var(--mantine-color-blue-0)' : 'transparent',
                    border: '1px solid transparent',
                    borderColor: isActive ? 'var(--mantine-color-blue-4)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--mantine-color-blue-6)' : '3px solid var(--mantine-color-gray-3)',
                    position: 'relative',
                    marginLeft: `${leftPadding}px`,
                    minHeight: '20px',
                    cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                        e.currentTarget.style.borderColor = 'var(--mantine-color-gray-3)';
                        e.currentTarget.style.borderLeftColor = 'var(--mantine-color-gray-4)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.borderLeftColor = 'var(--mantine-color-gray-3)';
                    }
                }}
                data-active={isActive || undefined}
            >
                <Group gap="xs" wrap="nowrap">
                    {hasChildren && (
                        <div
                            onClick={handleToggleExpand}
                            style={{ 
                                flexShrink: 0,
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            {isExpanded ? (
                                <IconChevronDown size={12} color="var(--mantine-color-gray-6)" />
                            ) : (
                                <IconChevronRight size={12} color="var(--mantine-color-gray-6)" />
                            )}
                        </div>
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
                    </Box>
                </Group>
            </div>

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

    return content;
}
