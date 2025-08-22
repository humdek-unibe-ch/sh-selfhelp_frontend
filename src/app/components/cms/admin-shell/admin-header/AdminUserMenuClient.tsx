'use client';

import { Button, Menu, Avatar, Text } from '@mantine/core';
import { IconUser, IconLogout, IconSettings } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { AuthApi } from '../../../../../api/auth.api';

interface IAdminUserMenuClientProps {
    userData: any;
}

/**
 * Client Component for Admin User Menu
 * Handles interactive user actions in admin header
 */
export function AdminUserMenuClient({ userData }: IAdminUserMenuClientProps) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await AuthApi.logout();
            router.push('/auth/login');
        } catch (error) {

        }
    };

    const userName = userData?.name || userData?.email || 'Admin User';

    return (
        <Menu shadow="md" width={200}>
            <Menu.Target>
                <Button 
                    variant="subtle" 
                    leftSection={<Avatar size="sm" radius="xl">{userName.charAt(0)}</Avatar>}
                    size="sm"
                >
                    <Text size="sm" truncate>
                        {userName}
                    </Text>
                </Button>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Item 
                    leftSection={<IconSettings size="1rem" />}
                    onClick={() => router.push('/admin/preferences')}
                >
                    Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                    leftSection={<IconLogout size="1rem" />}
                    onClick={handleLogout}
                    color="red"
                >
                    Logout
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}
