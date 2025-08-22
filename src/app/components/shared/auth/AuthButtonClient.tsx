'use client';

import { Button, Menu } from '@mantine/core';
import { IconUser, IconLogout, IconSettings } from '@tabler/icons-react';
import { useAuth } from '../../../../hooks/useAuth';
import { ROUTES } from '../../../../config/routes.config';
import { useRouter } from 'next/navigation';
import { AuthApi } from '../../../../api/auth.api';

/**
 * Client Component for Authentication Button
 * Handles interactive authentication actions (login, logout, profile access)
 */
export function AuthButtonClient() {
    const { isAuthenticated, user, isLoading } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await AuthApi.logout();
            router.push(ROUTES.LOGIN);
        } catch (error) {

        }
    };

    if (isLoading) {
        return <Button loading size="sm">Loading...</Button>;
    }

    if (!isAuthenticated) {
        return (
            <Button 
                variant="light"
                size="sm"
                onClick={() => router.push(ROUTES.LOGIN)}
            >
                Login
            </Button>
        );
    }

    return (
        <Menu shadow="md" width={200}>
            <Menu.Target>
                <Button 
                    variant="subtle" 
                    leftSection={<IconUser size="1rem" />}
                    size="sm"
                >
                    {user?.name || user?.email || 'User'}
                </Button>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Item 
                    leftSection={<IconSettings size="1rem" />}
                    onClick={() => router.push('/profile')}
                >
                    Profile
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
