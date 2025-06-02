"use client";

import { ScrollArea, ActionIcon, Tooltip, Group, Box } from '@mantine/core';
import { IconAdjustmentsCog, IconFiles, IconMessageCircleQuestion, IconSettings, IconSettingsAutomation, IconPlus } from '@tabler/icons-react';
import { LinksGroup } from '../../common/navbar-links-group/NavbarLinksGroup';
import { CreatePageModal } from '../pages/create-page/CreatePage';
import classes from './AdminNavbar.module.css';
import { useState } from 'react';
import { useAdminPages } from '../../../../hooks/useAdminPages';

export function AdminNavbar() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { pages } = useAdminPages();

    const navItems = [
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
            children: pages
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
                    {navItems.map((item) => (
                        <LinksGroup {...item} key={item.label} />
                    ))}
                </div>
            </ScrollArea>
            <CreatePageModal opened={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
