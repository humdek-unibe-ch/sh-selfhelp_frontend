import { Group, Menu, UnstyledButton, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { ServerApi } from '../../../../api/server.api';
import { IPageItem } from '../../../../types/responses/frontend/frontend.types';
import { InternalLink } from '../../shared';

// Helper function to get page title
const getPageTitle = (item: IPageItem): string => {
    if (item.title && item.title.trim()) {
        return item.title;
    }
    return item.keyword.charAt(0).toUpperCase() + item.keyword.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');
};

interface IMenuItemProps {
    item: IPageItem;
}

function MenuItem({ item }: IMenuItemProps) {
    const hasChildren = item.children && item.children.length > 0;
    const pageTitle = getPageTitle(item);

    if (hasChildren) {
        return (
            <Menu key={item.id_pages} trigger="hover" withinPortal>
                <Menu.Target>
                    <UnstyledButton>
                        <Group gap="xs">
                            <Text size="sm" fw={500}>{pageTitle}</Text>
                            <IconChevronDown size={16} stroke={1.5} />
                        </Group>
                    </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                    {item.children?.map((child: IPageItem) => (
                        <Menu.Item key={child.id_pages}>
                            <InternalLink href={child.url || ''}>
                                <Text size="sm">{getPageTitle(child)}</Text>
                            </InternalLink>
                        </Menu.Item>
                    ))}
                </Menu.Dropdown>
            </Menu>
        );
    }

    return (
        <InternalLink key={item.id_pages} href={item.url || ''}>
            <UnstyledButton>
                <Text size="sm" fw={500}>{pageTitle}</Text>
            </UnstyledButton>
        </InternalLink>
    );
}

/**
 * Server Component for Website Header Menu
 * Pre-fetches and renders navigation menu on the server
 */
export async function WebsiteHeaderMenuServer() {
    // Fetch frontend pages on server - default to language ID 1
    const frontendPages = await ServerApi.getFrontendPages(1);
    
    if (!frontendPages) {
        return null;
    }

    // Filter for menu pages
    const menuPages = frontendPages
        .filter((page: IPageItem) => page.nav_position !== null && !page.is_headless)
        .sort((a: IPageItem, b: IPageItem) => (a.nav_position ?? 0) - (b.nav_position ?? 0))
        .filter((page: IPageItem) => page.parent_page_id === null); // Only top-level items

    if (menuPages.length === 0) {
        return null;
    }

    return (
        <Group gap="md" visibleFrom="sm">
            {menuPages.map((item: IPageItem) => (
                <MenuItem key={item.id_pages} item={item} />
            ))}
        </Group>
    );
}
