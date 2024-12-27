"use client";

import { ScrollArea } from '@mantine/core';
import { IconAdjustmentsCog, IconFiles, IconMessageCircleQuestion, IconSettings, IconSettingsAutomation } from '@tabler/icons-react';
import { LinksGroup } from '../../common/navbar-links-group/NavbarLinksGroup';
import classes from './AdminNavbar.module.css';

const mockData = [
    {
        label: 'Configuration',
        icon: <IconSettingsAutomation size="1rem" stroke={1.5} />,
        children: [
            {
                label: 'Global Values',
                link: '/admin/pages/globals',
            },
            {
                label: 'Custom CSS',
                link: '/admin/pages/css',
            }
        ]
    },
    {
        label: 'System Pages',
        icon: <IconAdjustmentsCog size="1rem" stroke={1.5} />,
        children: [
            {
                label: 'Login',
                link: '/admin/pages/login',
            },
            {
                label: 'Register',
                link: '/admin/pages/register',
            },
            {
                label: 'Not found',
                link: '/admin/pages/notfound',
            }
        ]
    },
    {
        label: 'Pages',
        icon: <IconFiles size="1rem" stroke={1.5} />,
        children: [
            {
                label: 'PageRoot',
                // link: '/admin/pages/pageRoot',
                children: [
                    { label: 'Page 1', link: '/admin/pages/page1' },
                    { label: 'Page 2', link: '/admin/pages/page2' }
                ]
            },
            {
                label: 'Test',
                link: '/admin/pages/test'
            },
            {
                label: 'Blog',
                // link: '/admin/pages/blog',
                children: [
                    { label: 'Posts', link: '/admin/pages/posts' },
                    { label: 'Categories', link: '/admin/pages/categories' }
                ]
            }
        ]
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

export function AdminNavbar(): JSX.Element {
    const links = mockData.map((item) => (
        <LinksGroup {...item} key={item.label} />
    ));

    return (
        <nav className={classes.navbar}>

            <ScrollArea className={classes.links}>
                <div className={classes.linksInner}>{links}</div>
            </ScrollArea>
        </nav>
    );
}
