'use client';

import { Button, Menu } from '@mantine/core';
import { IconLogin, IconLogout, IconUser } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@refinedev/core';
import { ROUTES } from '../../../config/routes.config';
import { AuthApi } from '../../../api/auth.api';

export function AuthButton() {
    const { data: { authenticated } = {}, isLoading: isAuthLoading } = useIsAuthenticated();
    const router = useRouter();

    const handleLogin = () => {
        router.push(ROUTES.LOGIN);
    };

    const handleLogout = async () => {
        try {
            await AuthApi.logout();
            router.push(ROUTES.LOGIN);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Don't render anything until we have initial state
    if (isAuthLoading) {
        return null;
    }

    if (!authenticated) {
        return (
            <Button
                onClick={handleLogin}
                leftSection={<IconLogin size={14} />}
                variant="subtle"
            >
                Login
            </Button>
        );
    }

    return (
        <Menu position="bottom-end" withArrow>
            <Menu.Target>
                <Button
                    variant="subtle"
                    leftSection={<IconUser size={14} />}
                >
                    Profile
                </Button>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={14} />}
                    onClick={handleLogout}
                >
                    Logout
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}
