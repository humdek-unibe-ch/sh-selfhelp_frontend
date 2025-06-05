'use client';

import { useState, useEffect } from 'react';
import { Button, Menu } from '@mantine/core';
import { IconLogin, IconLogout, IconUser } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useLogout } from '@refinedev/core';
import { ROUTES } from '../../../config/routes.config';
import { getAccessToken, getRefreshToken } from '../../../utils/auth.utils';
import { debug } from '../../../utils/debug-logger';

export function AuthButton() {
    const { data: { authenticated } = {}, isLoading: isAuthLoading } = useIsAuthenticated();
    const { mutate: logout, isLoading: isLoggingOut } = useLogout();
    const [stableAuthState, setStableAuthState] = useState<boolean | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();

    // Create a more stable auth state that doesn't flicker during refresh
    useEffect(() => {
        const checkStableAuth = () => {
            const hasToken = !!getAccessToken();
            const hasRefreshToken = !!getRefreshToken();
            
            // If we have either token, consider user as authenticated
            // This prevents flickering during token refresh
            const isStablyAuthenticated = hasToken || hasRefreshToken;
            
            setStableAuthState(isStablyAuthenticated);
        };

        // Check immediately
        checkStableAuth();

        // Listen for storage changes (token updates)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token' || e.key === 'refresh_token') {
                debug('Token storage changed, rechecking auth state', 'AuthButton');
                checkStableAuth();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Also check periodically to catch any missed updates
        const interval = setInterval(checkStableAuth, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [authenticated]);

    // Monitor for token refresh activity
    useEffect(() => {
        const checkRefreshState = () => {
            // Check if there's ongoing refresh activity
            const hasToken = !!getAccessToken();
            const hasRefreshToken = !!getRefreshToken();
            const refineThinks = authenticated;
            
            // If we have tokens but Refine thinks we're not authenticated,
            // we're probably in the middle of a refresh
            const probablyRefreshing = (hasToken || hasRefreshToken) && !refineThinks;
            
            if (probablyRefreshing !== isRefreshing) {
                debug('Refresh state changed', 'AuthButton', { 
                    probablyRefreshing,
                    hasToken,
                    hasRefreshToken,
                    refineThinks
                });
                setIsRefreshing(probablyRefreshing);
            }
        };

        checkRefreshState();
        const interval = setInterval(checkRefreshState, 500);

        return () => clearInterval(interval);
    }, [authenticated, isRefreshing]);

    const handleLogin = () => {
        router.push(ROUTES.LOGIN);
    };

    const handleLogout = () => {
        debug('Logout initiated from AuthButton', 'AuthButton');
        setStableAuthState(false); // Immediately update UI
        
        // Use Refine's logout hook which will:
        // 1. Call the auth provider's logout method
        // 2. Handle the redirect automatically based on redirectTo
        logout({
            redirectPath: ROUTES.LOGIN
        });
    };

    // Show loading state during initial load, when Refine is loading, or during logout
    if (isAuthLoading || stableAuthState === null || isLoggingOut) {
        return null;
    }

    // Use stable auth state instead of Refine's reactive state
    // This prevents flickering during token refresh
    const shouldShowAsAuthenticated = stableAuthState || (isRefreshing && stableAuthState !== false);

    if (!shouldShowAsAuthenticated) {
        debug('Showing login button', 'AuthButton', {
            stableAuthState,
            isRefreshing,
            authenticated
        });
        
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

    debug('Showing profile menu', 'AuthButton', {
        stableAuthState,
        isRefreshing,
        authenticated
    });

    return (
        <Menu position="bottom-end" withArrow>
            <Menu.Target>
                <Button
                    variant="subtle"
                    leftSection={<IconUser size={14} />}
                    style={{ 
                        opacity: isRefreshing ? 0.7 : 1,
                        transition: 'opacity 0.2s ease'
                    }}
                >
                    Profile
                </Button>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={14} />}
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}
