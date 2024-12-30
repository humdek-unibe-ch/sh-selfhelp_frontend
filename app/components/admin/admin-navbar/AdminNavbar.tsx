"use client";

import { ScrollArea, ActionIcon, Tooltip, Group, Box } from '@mantine/core';
import { IconAdjustmentsCog, IconFiles, IconMessageCircleQuestion, IconSettings, IconSettingsAutomation, IconPlus } from '@tabler/icons-react';
import { LinksGroup } from '../../common/navbar-links-group/NavbarLinksGroup';
import { CreatePagePanel } from '../pages/CreatePagePanel';
import { useState } from 'react';
import classes from './AdminNavbar.module.css';

export function AdminNavbar() {
    const [isModalOpen, setIsModalOpen] = useState(false);
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
            rightSection: (
                <Tooltip label="Create new page" position="right">
                    <Box
                        component="div"
                        style={{ display: 'inline-flex' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            // Add your create page logic here
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

    return (
        <nav className={classes.navbar}>
            <ScrollArea className={classes.scrollArea}>
                <Group justify="space-between" px="md" py="sm">
                    <Box>SelfHelp</Box>
                </Group>

                <div className={classes.linksInner}>
                    {mockData.map((item) => (
                        <LinksGroup {...item} key={item.label} />
                    ))}
                </div>
            </ScrollArea>

            <CreatePagePanel isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </nav>
    );
}
