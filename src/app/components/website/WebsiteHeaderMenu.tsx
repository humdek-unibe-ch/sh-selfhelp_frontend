'use client';

import { IconChevronDown } from '@tabler/icons-react';
import { Group, Menu, Skeleton, UnstyledButton, Text } from '@mantine/core';
import { InternalLink } from '../shared/InternalLink';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { IPageItem } from '../../../types/responses/frontend/frontend.types';

interface IMenuItemProps {
    item: IPageItem;
}

function MenuItem({ item }: IMenuItemProps) {
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
        return (
            <Menu key={item.id_pages} trigger="hover" withinPortal>
                <Menu.Target>
                    <UnstyledButton>
                        <Group gap="xs">
                            <Text size="sm" fw={500}>{item.keyword}</Text>
                            <IconChevronDown size={16} stroke={1.5} />
                        </Group>
                    </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                    {item.children?.map(child => (
                        <Menu.Item key={child.id_pages}>
                            <InternalLink href={child.url}>
                                <Text size="sm">{child.keyword}</Text>
                            </InternalLink>
                        </Menu.Item>
                    ))}
                </Menu.Dropdown>
            </Menu>
        );
    }

    return (
        <InternalLink key={item.id_pages} href={item.url}>
            <UnstyledButton>
                <Text size="sm" fw={500}>{item.keyword}</Text>
            </UnstyledButton>
        </InternalLink>
    );
}

function MenuSkeleton() {
    return (
        <Group gap="md" visibleFrom="sm">
            {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} height={32} width={80} radius="sm" />
            ))}
        </Group>
    );
}

export function WebsiteHeaderMenu() {
    const { menuPages, isLoading } = useAppNavigation();

    if (isLoading) {
        return <MenuSkeleton />;
    }

    // Use only top-level items (parent === null) since children are already included
    const menuItems = menuPages
        .filter(page => page.parent === null)
        .map(item => (
            <MenuItem key={item.id_pages} item={item} />
        ));

    return (
        <Group gap="md" visibleFrom="sm">
            {menuItems}
        </Group>
    );
}