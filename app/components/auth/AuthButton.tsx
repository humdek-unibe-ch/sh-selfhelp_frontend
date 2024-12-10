'use client';

import { Button, Menu, Group } from '@mantine/core';
import { IconLogin, IconLogout, IconUser } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { useIsAuthenticated } from '@refinedev/core';

export function AuthButton() {
    const { data: { authenticated } = {} } = useIsAuthenticated();
    const router = useRouter();

    const handleLogin = () => {
        router.push('/auth/login');
    };

    const handleLogout = async () => {
        try {
            await AuthService.logout();
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };


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
