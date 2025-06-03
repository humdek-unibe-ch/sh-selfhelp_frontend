"use client";

import { ScrollArea, ActionIcon, Tooltip, Group, Box } from '@mantine/core';
import { IconAdjustmentsCog, IconFiles, IconMessageCircleQuestion, IconSettings, IconSettingsAutomation, IconPlus } from '@tabler/icons-react';
import { LinksGroup } from '../../common/navbar-links-group/NavbarLinksGroup';
import { CreatePageModal } from '../pages/create-page/CreatePage';
import classes from './AdminNavbar.module.css';
import { useState } from 'react';
import { IAdminPage } from '../../../../types/responses/admin/admin.types';
import { debug } from '../../../../utils/debug-logger';
import { useAdminPages } from '../../../../hooks/useAdminPages';

export function AdminNavbar() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { pages, isLoading } = useAdminPages();

    // Transform pages into LinkItem format for LinksGroup with proper ordering and nesting
    const transformPagesToLinks = (pages: IAdminPage[]) => {
        const pageMap = new Map<number, any>();
        const rootPages: any[] = [];

        // First pass: create all page items
        pages.forEach(page => {
            pageMap.set(page.id_pages, {
                label: page.keyword,
                link: `/admin/pages/${page.keyword}`,
                hasNavPosition: page.nav_position !== null,
                navPosition: page.nav_position,
                pageId: page.id_pages,
                children: []
            });
        });

        // Second pass: build the tree structure
        pages.forEach(page => {
            const pageItem = pageMap.get(page.id_pages)!;
            
            if (page.parent === null) {
                // Root level page
                rootPages.push(pageItem);
            } else {
                // Child page
                const parentPage = pageMap.get(page.parent);
                if (parentPage) {
                    parentPage.children.push(pageItem);
                }
            }
        });

        // Sort root pages: menu pages first (by nav_position), then others alphabetically
        rootPages.sort((a, b) => {
            // If both have nav_position, sort by nav_position
            if (a.hasNavPosition && b.hasNavPosition) {
                return a.navPosition - b.navPosition;
            }
            // Menu pages come first
            if (a.hasNavPosition && !b.hasNavPosition) return -1;
            if (!a.hasNavPosition && b.hasNavPosition) return 1;
            // Both non-menu pages, sort alphabetically
            return a.label.localeCompare(b.label);
        });

        // Sort children alphabetically within each parent
        const sortChildren = (items: any[]) => {
            items.forEach(item => {
                if (item.children.length > 0) {
                    item.children.sort((a: any, b: any) => a.label.localeCompare(b.label));
                    sortChildren(item.children);
                }
            });
        };
        sortChildren(rootPages);

        debug('Transformed pages for navigation', 'AdminNavbar', { 
            totalPages: pages.length,
            rootPages: rootPages.length,
            menuPages: rootPages.filter(p => p.hasNavPosition).length
        });

        return rootPages;
    };

    const pageLinks = isLoading ? [] : transformPagesToLinks(pages);

    const staticNavItems = [
        {
            label: 'Configuration',
            icon: <IconSettingsAutomation size="1rem" stroke={1.5} />,
            children: [
                { label: 'Global Values', link: '/admin/pages/globals' },
                { label: 'Custom CSS', link: '/admin/pages/css' }
            ]
        },
        {
            label: 'System Pages',
            icon: <IconAdjustmentsCog size="1rem" stroke={1.5} />,
            children: [
                { label: 'Login', link: '/admin/pages/login' },
                { label: 'Register', link: '/admin/pages/register' },
                { label: 'Not found', link: '/admin/pages/notfound' }
            ]
        },
        {
            label: 'Pages',
            icon: <IconFiles size="1rem" stroke={1.5} />,
            rightSection: (
                <Tooltip label="Create new page" position="right">
                    <Box
                        component="div"
                        style={{ display: 'inline-flex' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsModalOpen(true);
                        }}
                    >
                        <ActionIcon
                            component="div"
                            variant="light"
                            size="sm"
                            color="blue"
                        >
                            <IconPlus size="1rem" stroke={1.5} />
                        </ActionIcon>
                    </Box>
                </Tooltip>
            ),
            children: pageLinks
        },
        {
            label: 'Settings',
            icon: <IconSettings size="1rem" stroke={1.5} />,
            link: "/admin/settings"
        },
        {
            label: 'Learning Assistance',
            icon: <IconMessageCircleQuestion size="1rem" stroke={1.5} />,
            link: "/admin/help"
        }
    ];

    return (
        <>
            <ScrollArea className={classes.navbar}>
                <div className={classes.navbarMain}>
                    {staticNavItems.map((item) => (
                        <LinksGroup {...item} key={item.label} />
                    ))}
                </div>
            </ScrollArea>
            <CreatePageModal opened={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
