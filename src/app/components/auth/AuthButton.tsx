'use client';

import { useState, useEffect } from 'react';
import { Button, Menu } from '@mantine/core';
import { IconLogin, IconLogout, IconUser, IconSettings } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useLogout } from '@refinedev/core';
import { ROUTES } from '../../../config/routes.config';
import { getAccessToken, getRefreshToken } from '../../../utils/auth.utils';
import { IAdminPage } from '../../../types/responses/admin/admin.types';
import { useAppNavigation } from '../../../hooks/useAppNavigation';

// Helper function to get page title - use actual title from API or fallback to formatted keyword
const getPageTitle = (page: IAdminPage | { keyword: string; title?: string | null }): string => {
    // Use the actual title if available, otherwise format the keyword as fallback
    if ('title' in page && page.title && page.title.trim()) {
        return page.title;
    }
    // Fallback to formatted keyword
    return page.keyword.charAt(0).toUpperCase() + page.keyword.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');
};

export function AuthButton() {
    const { data: { authenticated } = {}, isLoading: isAuthLoading } = useIsAuthenticated();
    const { mutate: logout, isLoading: isLoggingOut } = useLogout();
    const { profilePages } = useAppNavigation();
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
        setStableAuthState(false); // Immediately update UI
        
        // Use Refine's logout hook which will:
        // 1. Call the auth provider's logout method
        // 2. Handle the redirect automatically based on redirectTo
        logout({
            redirectPath: ROUTES.LOGIN
        });
    };

    const handleMenuItemClick = (keyword: string) => {
        if (keyword === 'logout') {
            handleLogout();
        } else {
            // Navigate to the page
            router.push(`/${keyword}`);
        }
    };

    const getMenuItemIcon = (keyword: string) => {
        switch (keyword) {
            case 'profile':
                return <IconSettings size={14} />;
            case 'logout':
                return <IconLogout size={14} />;
            default:
                return <IconSettings size={14} />;
        }
    };

    // Show loading state during initial load, when Refine is loading, or during logout
    if (isAuthLoading || stableAuthState === null || isLoggingOut) {
        return null;
    }

    // Use stable auth state instead of Refine's reactive state
    // This prevents flickering during token refresh
    const shouldShowAsAuthenticated = stableAuthState || (isRefreshing && stableAuthState !== false);

    if (!shouldShowAsAuthenticated) {
        
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

    // Get the profile link title
    const profileTitle = profilePages.length > 0 ? getPageTitle(profilePages[0]) : 'Profile';
    const profileChildren = profilePages[0]?.children || [];

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
                    {profileTitle}
                </Button>
            </Menu.Target>

            <Menu.Dropdown>
                {profileChildren.length > 0 ? (
                    profileChildren.map((child) => (
                        <Menu.Item
                            key={child.keyword}
                            leftSection={getMenuItemIcon(child.keyword)}
                            onClick={() => handleMenuItemClick(child.keyword)}
                            disabled={isLoggingOut && child.keyword === 'logout'}
                            color={child.keyword === 'logout' ? 'red' : undefined}
                        >
                            {child.keyword === 'logout' && isLoggingOut ? 'Logging out...' : getPageTitle(child)}
                        </Menu.Item>
                    ))
                ) : (
                    // Fallback if no children found
                    <Menu.Item
                        color="red"
                        leftSection={<IconLogout size={14} />}
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </Menu.Item>
                )}
            </Menu.Dropdown>
        </Menu>
    );
}
