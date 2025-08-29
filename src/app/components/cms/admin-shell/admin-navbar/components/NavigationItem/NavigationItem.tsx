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
import { useNavigationStore } from '../../../../../../store/navigation.store';
import styles from './NavigationItem.module.css';

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

    const handleClick = (e: React.MouseEvent) => {
        // Support middle click and ctrl+click for new tab
        if (e.button === 1 || e.ctrlKey || e.metaKey) {
            window.open(href, '_blank');
            return;
        }

        if (onClick) {
            onClick();
        } else {
            setActiveItem(href);
            router.push(href);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        // Allow right-click context menu for "open in new tab"
        e.stopPropagation();
    };

    const itemContent = (
        <UnstyledButton
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            className={styles.navItem}
            px="xs"
            py={2}
            data-active={isActive || undefined}
        >
            <Group gap="xs" wrap="nowrap">
                {icon}
                <Box className={styles.navItemText}>
                    <Text
                        size="xs"
                        fw={isActive ? 600 : 400}
                        truncate
                        c={isActive ? 'blue.6' : 'gray.7'}
                    >
                        {label}
                    </Text>
                    {badge && (
                        <Badge size="xs" color={badge.color} variant="light" mt={2}>
                            {badge.text}
                        </Badge>
                    )}
                </Box>
            </Group>
        </UnstyledButton>
    );

    if (description) {
        return (
            <Tooltip
                label={description}
                position="right"
                multiline
                w={200}
                withArrow
            >
                {itemContent}
            </Tooltip>
        );
    }

    return itemContent;
}
