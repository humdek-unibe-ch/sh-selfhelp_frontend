'use client';

import { useState } from 'react';
import { Button, Menu } from '@mantine/core';
import { IconLogin, IconLogout, IconUser, IconSettings } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@refinedev/core';
import { useAuthStatus } from '../../../../hooks/useUserData';
import { ROUTES } from '../../../../config/routes.config';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { IPageItem } from '../../../../types/common/pages.type';
import { getPageTitle } from '../../../../utils/navigation.utils';

interface IAuthButtonProps {
    /**
     * Profile-link pages resolved on the server (`getProfilePagesSSR`)
     * and passed in by the Server Component `WebsiteHeader`. Used as the
     * source for the profile button label / dropdown items on the very
     * first render, so the SSR HTML carries the translated title (e.g.
     * "Profil" in German) instead of the hardcoded English `'Profile'`
     * fallback. Once `useAppNavigation` returns live data we prefer
     * that, but the live data normally matches the SSR data char-for-char
     * because both go through the same `selectProfilePages` helper.
     *
     * Defaults to an empty array so the button still works when rendered
     * outside the SSR header (tests, storybook, anonymous pages).
     */
    initialProfilePages?: IPageItem[];
}

export function AuthButton({ initialProfilePages = [] }: IAuthButtonProps = {}) {
    // Derive auth state from the SSR-hydrated `['user-data']` cache rather
    // than Refine's `useIsAuthenticated`. The latter has its own internal
    // `useQuery` that always starts with `isLoading: true` and resolves
    // after one tick, which caused the profile button to flash null/Login
    // on every hard reload. Our own cache is seeded by `ServerProviders`
    // before hydration, so first-paint already knows the real state.
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthStatus();
    const { mutate: logout } = useLogout();
    const { profilePages: liveProfilePages } = useAppNavigation();
    // Prefer live React Query data once it arrives; fall back to the
    // SSR-seeded list during the first paint window so the SSR HTML and
    // the post-hydration render produce identical text — no
    // "Profile → Profil" jump.
    const profilePages = liveProfilePages.length > 0 ? liveProfilePages : initialProfilePages;
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    const handleLogin = () => {
        router.push(ROUTES.LOGIN);
    };

    const handleLogout = () => {
        setIsLoggingOut(true);
        logout({ redirectPath: ROUTES.LOGIN });
    };

    const handleMenuItemClick = (keyword: string) => {
        if (keyword === 'logout') {
            handleLogout();
        } else {
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

    if (isAuthLoading || isLoggingOut) {
        return null;
    }

    if (!isAuthenticated) {
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
                    // Fallback when the `profile-link` page is absent from
                    // the CMS catalogue (the recent migration deletes it,
                    // since `profile-link` was a pure-label page with no
                    // body content). We still want the avatar dropdown to
                    // be useful, so we synthesize the two minimum-viable
                    // entries: a link to the user's profile page and the
                    // sign-out action.
                    <>
                        <Menu.Item
                            leftSection={<IconSettings size={14} />}
                            onClick={() => router.push(ROUTES.PROFILE)}
                        >
                            Profile
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                            color="red"
                            leftSection={<IconLogout size={14} />}
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </Menu.Item>
                    </>
                )}
            </Menu.Dropdown>
        </Menu>
    );
}
