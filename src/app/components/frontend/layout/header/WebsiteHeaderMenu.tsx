'use client';

import { IconChevronDown } from '@tabler/icons-react';
import { Group, Menu, UnstyledButton, Text } from '@mantine/core';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { usePagePrefetch } from '../../../../../hooks/usePagePrefetch';
import { IPageItem } from '../../../../../types/responses/frontend/frontend.types';
import { InternalLink } from '../../../shared';
import { getPageTitle } from '../../../../../utils/navigation.utils';

interface IMenuItemProps {
    item: IPageItem;
}

function MenuItem({ item }: IMenuItemProps) {
    const hasChildren = item.children && item.children.length > 0;
    const pageTitle = getPageTitle(item);
    const { createHoverPrefetch } = usePagePrefetch();

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
                        <Menu.Item
                            key={child.id_pages}
                            onMouseEnter={child.keyword ? createHoverPrefetch(child.keyword) : undefined}
                        >
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
            <UnstyledButton onMouseEnter={item.keyword ? createHoverPrefetch(item.keyword) : undefined}>
                <Text size="sm" fw={500}>{pageTitle}</Text>
            </UnstyledButton>
        </InternalLink>
    );
}

interface IWebsiteHeaderMenuProps {
    /**
     * Server-rendered menu list. Resolved by the parent Server Component
     * (`WebsiteHeader`) via `getMenuPagesSSR`, then passed down so the
     * very first painted frame already shows the real menu items —
     * eliminating the old "render header → menu pops in" flash.
     *
     * The client `useAppNavigation` query takes over after hydration and
     * any newer data (e.g. after an ACL refresh) replaces this list
     * automatically.
     */
    initialMenuPages?: IPageItem[];
}

/**
 * Website Header Menu.
 *
 * Renders the top-level navigation links + hover dropdowns. The list is
 * always derived from `initialMenuPages` first (server-resolved on every
 * SSR), and overridden by the live React Query `useAppNavigation` data once
 * it differs — so subsequent ACL changes refresh the menu without a click.
 */
export function WebsiteHeaderMenu({ initialMenuPages = [] }: IWebsiteHeaderMenuProps) {
    const { menuPages: liveMenuPages } = useAppNavigation();

    // Prefer live data when available — it picks up ACL-driven changes via
    // `useAclVersionWatcher` and `useAclEventStream`. Fall back to the SSR
    // list so the very first paint always renders the real menu HTML.
    const menuPages = liveMenuPages.length > 0 ? liveMenuPages : initialMenuPages;

    if (menuPages.length === 0) {
        return null;
    }

    const menuItems = menuPages
        .filter(page => page.parent_page_id === null)
        .map(item => (
            <MenuItem key={item.id_pages} item={item} />
        ));

    return (
        <Group gap="md" visibleFrom="sm">
            {menuItems}
        </Group>
    );
}
