'use client';

import { Box, Collapse, Group, Text, ThemeIcon, UnstyledButton, Badge } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useNavigationStore, useNavigationOpenItems, useNavigationActiveItem } from '../../../store/navigation.store';
import classes from './NavbarLinksGroup.module.css';
import React from 'react';

interface LinkItem {
    label: string;
    link?: string;
    children?: LinkItem[];
    icon?: React.ReactNode;
    hasNavPosition?: boolean;
    nav_position?: number | null;
    footer_position?: number | null;
    onClick?: () => void;
    keyword?: string;
}

interface LinksGroupProps {
    icon: React.ReactNode;
    label: string;
    initiallyOpened?: boolean;
    link?: string;
    children?: LinkItem[] | React.ReactNode;
    rightSection?: React.ReactNode;
}

export function LinksGroup({ icon, label, initiallyOpened, children, link, rightSection }: LinksGroupProps) {
    const router = useRouter();
    const isLinkArray = Array.isArray(children);
    const hasLinks = isLinkArray && children.length > 0;
    const hasCustomContent = !isLinkArray && React.isValidElement(children);
    const hasAnyContent = hasLinks || hasCustomContent;
    
    const { toggleItem, setActiveItem } = useNavigationStore();
    const openItems = useNavigationOpenItems();
    const activeItem = useNavigationActiveItem();
    const isOpen = openItems.includes(label) || Boolean(initiallyOpened);
    const isActive = activeItem === link;

    const renderItems = (items: LinkItem[], parentPath = '') => {
        return items.map((item) => {
            const itemPath = `${parentPath}/${item.label}`;
            const hasNestedLinks = Array.isArray(item.children) && item.children.length > 0;
            const isItemOpen = openItems.includes(itemPath);
            const isItemActive = activeItem === item.link;
            const isMenuPage = item.nav_position !== null && item.nav_position !== undefined;
            const isFooterPage = item.footer_position !== null && item.footer_position !== undefined;

            return (
                <div className={classes.children} key={item.keyword || item.label}>
                    <div
                        className={classes.link}
                        data-active={isItemActive || undefined}
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    >
                        <Group justify="space-between" gap={0} style={{ width: '100%' }}>
                            <Group gap="xs" style={{ flex: 1 }}>                                
                                {/* Page label - clickable for navigation */}
                                <Text 
                                    size="xs" 
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1
                                    }}
                                    title={item.label}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        if (item.onClick) {
                                            item.onClick();
                                        } else if (item.link) {
                                            setActiveItem(item.link);
                                            router.push(item.link);
                                        }
                                    }}
                                >
                                    {item.label}
                                </Text>
                                
                                {/* Badges */}
                                <Group gap="xs">
                                    {isMenuPage && (
                                        <Badge size="xs" variant="light" color="blue">
                                            Menu
                                        </Badge>
                                    )}
                                    {isFooterPage && (
                                        <Badge size="xs" variant="light" color="green">
                                            Footer
                                        </Badge>
                                    )}
                                </Group>
                            </Group>
                            
                            {/* Chevron - only for collapsing/expanding */}
                            {hasNestedLinks && (
                                <IconChevronRight
                                    className={classes.chevron}
                                    stroke={1.5}
                                    size={16}
                                    style={{ 
                                        transform: isItemOpen ? 'rotate(90deg)' : 'none',
                                        cursor: 'pointer' 
                                    }}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        toggleItem(itemPath);
                                    }}
                                />
                            )}
                        </Group>
                    </div>
                    {hasNestedLinks && (
                        <Collapse in={isItemOpen}>
                            <div>
                                {renderItems(item.children!, itemPath)}
                            </div>
                        </Collapse>
                    )}
                </div>
            );
        });
    };

    return (
        <>
            <UnstyledButton
                component="div"
                onClick={() => {
                    if (hasAnyContent) {
                        toggleItem(label);
                    }
                    if (link) {
                        setActiveItem(link);
                        router.push(link);
                    }
                }}
                className={classes.control}
                data-active={isActive || undefined}
            >
                <Group justify="space-between" gap={0}>
                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                        <ThemeIcon variant="light" size={30}>
                            {icon}
                        </ThemeIcon>
                        <Box ml="md">{label}</Box>
                    </Box>
                    <Group gap={0}>
                        {rightSection}
                        {hasAnyContent && (
                            <IconChevronRight
                                className={classes.chevron}
                                stroke={1.5}
                                size={16}
                                style={{
                                    transform: isOpen ? 'rotate(90deg)' : 'none',
                                    marginLeft: rightSection ? '0.5rem' : 0
                                }}
                            />
                        )}
                    </Group>
                </Group>
            </UnstyledButton>
            {hasAnyContent && (
                <Collapse in={isOpen}>
                    {hasLinks ? (
                        renderItems(children as LinkItem[], label)
                    ) : (
                        <div className={classes.children}>
                            {children as React.ReactNode}
                        </div>
                    )}
                </Collapse>
            )}
        </>
    );
}