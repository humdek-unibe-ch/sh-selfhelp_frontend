"use client";

import { ScrollArea, ActionIcon, Tooltip, Group, Box } from '@mantine/core';
import { IconAdjustmentsCog, IconFiles, IconMessageCircleQuestion, IconSettings, IconSettingsAutomation, IconPlus } from '@tabler/icons-react';
import { LinksGroup } from '../../common/navbar-links-group/NavbarLinksGroup';
import { CreatePageModal } from '../pages/create-page/CreatePage';
import { AdminPagesList } from '../pages/admin-pages-list/AdminPagesList';
import classes from './AdminNavbar.module.css';
import { useState } from 'react';
import { IAdminPage } from '../../../../types/responses/admin/admin.types';
import { debug } from '../../../../utils/debug-logger';

export function AdminNavbar() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handlePageSelect = (page: IAdminPage) => {
        debug('Page selected in navbar', 'AdminNavbar', { keyword: page.keyword });
    };

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
                    {/* Static navigation items */}
                    {staticNavItems.map((item) => (
                        <LinksGroup {...item} key={item.label} />
                    ))}

                    {/* Pages section with custom component */}
                    <LinksGroup
                        label="Pages"
                        icon={<IconFiles size="1rem" stroke={1.5} />}
                        rightSection={
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
                        }
                        initiallyOpened={true}
                    >
                        <AdminPagesList onPageSelect={handlePageSelect} />
                    </LinksGroup>
                </div>
            </ScrollArea>
            <CreatePageModal opened={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
