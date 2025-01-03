'use client';

import { Box, Collapse, Group, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { IconChevronRight, IconClipboard } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useNavigationStore, useNavigationOpenItems, useNavigationActiveItem } from '@/store/navigation.store';
import classes from './NavbarLinksGroup.module.css';

interface LinkItem {
    label: string;
    link?: string;
    children?: LinkItem[];
    icon?: React.ReactNode;
}

interface LinksGroupProps {
    icon: React.ReactNode;
    label: string;
    initiallyOpened?: boolean;
    link?: string;
    children?: LinkItem[];
    rightSection?: React.ReactNode;
}

export function LinksGroup({ icon, label, initiallyOpened, children, link, rightSection }: LinksGroupProps) {
    const router = useRouter();
    const hasLinks = Array.isArray(children) && children.length > 0;
    const { toggleItem, setActiveItem } = useNavigationStore();
    const openItems = useNavigationOpenItems();
    const activeItem = useNavigationActiveItem();
    const isOpen = openItems.includes(label);
    const isActive = activeItem === link;

    const renderItems = (items: LinkItem[], parentPath = '') => {
        return items.map((item) => {
            const itemPath = `${parentPath}/${item.label}`;
            const hasNestedLinks = Array.isArray(item.children) && item.children.length > 0;
            const isItemOpen = openItems.includes(itemPath);
            const isItemActive = activeItem === item.link;

            return (
                <div className={classes.children} key={item.label}>
                    <Text<'a'>
                        component="a"
                        className={classes.link}
                        data-active={isItemActive || undefined}
                        href={item.link}
                        onClick={(event) => {
                            event.preventDefault();
                            if (hasNestedLinks) {
                                toggleItem(itemPath);
                            }
                            if (item.link) {
                                setActiveItem(item.link);
                                router.push(item.link);
                            }
                        }}
                    >
                        <Group justify="space-between" gap={0}>
                            <Group gap="sm">
                                {item.icon ? (
                                    <ThemeIcon variant="light" size={30} opacity={1}>
                                        {item.icon}
                                    </ThemeIcon>
                                ) : (
                                    <ThemeIcon variant="light"  size={30}>
                                        <IconClipboard size={16} opacity={1} />
                                    </ThemeIcon>
                                )}
                                <span>{item.label}</span>
                            </Group>
                            {hasNestedLinks && (
                                <IconChevronRight
                                    className={classes.chevron}
                                    stroke={1.5}
                                    size={16}
                                    style={{ transform: isItemOpen ? 'rotate(90deg)' : 'none' }}
                                />
                            )}
                        </Group>
                    </Text>
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
                    if (hasLinks) {
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
                        {hasLinks && (
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
            {hasLinks ? <Collapse in={isOpen}>{renderItems(children, label)}</Collapse> : null}
        </>
    );
}