'use client';

import { Button, Menu, Group } from '@mantine/core';
import { IconLogin, IconLogout, IconUser } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { AuthApi } from '@/api/auth.api';
import { useIsAuthenticated } from '@refinedev/core';
import { useEffect, useState } from 'react';

export function AuthButton() {
    const { data: { authenticated } = {}, isLoading: isAuthLoading } = useIsAuthenticated();
    const [localAuth, setLocalAuth] = useState<boolean | null>(null);
    const router = useRouter();

    // Initialize auth state from localStorage
    useEffect(() => {
        const hasToken = Boolean(localStorage.getItem('access_token'));
        setLocalAuth(hasToken);
    }, []);

    // Sync server auth state when it changes
    useEffect(() => {
        if (typeof authenticated !== 'undefined') {
            setLocalAuth(authenticated);
        }
    }, [authenticated]);

    const handleLogin = () => {
        router.push('/auth/login');
    };

    const handleLogout = async () => {
        try {
            await AuthApi.logout();
            setLocalAuth(false);
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Don't render anything until we have initial state
    if (localAuth === null) {
        return null;
    }

    if (!localAuth) {
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
