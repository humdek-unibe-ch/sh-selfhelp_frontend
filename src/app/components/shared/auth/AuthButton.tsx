'use client';

import { useState } from 'react';
import { Button, Menu } from '@mantine/core';
import { IconLogin, IconLogout, IconUser, IconSettings } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useLogout } from '@refinedev/core';
import { ROUTES } from '../../../../config/routes.config';
import { IAdminPage } from '../../../../types/responses/admin/admin.types';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { IPageItem } from '../../../../types/common/pages.type';

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
    const { mutate: logout } = useLogout();
    const { profilePages } = useAppNavigation();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    // With httpOnly cookies the client no longer has direct visibility into
    // the access/refresh tokens. Refine's `useIsAuthenticated` already polls
    // the BFF catch-all (`/api/auth/user-data`) under the hood, so we just
    // trust its result. A brief loading state is shown during the initial
    // check.
    const stableAuthState = isAuthLoading ? null : !!authenticated;

    const handleLogin = () => {
        router.push(ROUTES.LOGIN);
    };

    const handleLogout = () => {
        setIsLoggingOut(true);

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

    if (!stableAuthState) {
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
                >
                    {profileTitle}
                </Button>
            </Menu.Target>

            <Menu.Dropdown>
                {profileChildren.length > 0 ? (
                    profileChildren.map((child: IPageItem) => (
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
