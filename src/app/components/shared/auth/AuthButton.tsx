/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import { Button, Menu, Avatar, Group, Text, Box, UnstyledButton, Skeleton } from '@mantine/core';
import { IconLogin, IconLogout, IconUser, IconSettings, IconChevronDown } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@refinedev/core';
import { useAuthStatus, useAuthUser } from '../../../../hooks/useUserData';
import { ROUTES } from '../../../../config/routes.config';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { IPageItem } from '../../../../shared';
import { getPageTitle } from '../../../../utils/navigation.utils';
import { ThemeToggle } from '../common/ThemeToggle';

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
    /** `'navbar'` renders inside the admin sidebar footer with ThemeToggle pinned to the right. */
    variant?: 'navbar';
}

export function AuthButton({ initialProfilePages = [], variant }: IAuthButtonProps = {}) {
    // Derive auth state from the SSR-hydrated `['user-data']` cache rather
    // than Refine's `useIsAuthenticated`. The latter has its own internal
    // `useQuery` that always starts with `isLoading: true` and resolves
    // after one tick, which caused the profile button to flash null/Login
    // on every hard reload. Our own cache is seeded by `ServerProviders`
    // before hydration, so first-paint already knows the real state.
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthStatus();
    const { user } = useAuthUser();
    const { mutate: logout } = useLogout();
    const { profilePages: liveProfilePages } = useAppNavigation();
    // Prefer live React Query data once it arrives; fall back to the
    // SSR-seeded list during the first paint window so the SSR HTML and
    // the post-hydration render produce identical text — no
    // "Profile → Profil" jump.
    const profilePages = liveProfilePages.length > 0 ? liveProfilePages : initialProfilePages;
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    const handleLogin = () => router.push(ROUTES.LOGIN);

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
            case 'profile': return <IconSettings size={14} />;
            case 'logout': return <IconLogout size={14} />;
            default: return <IconSettings size={14} />;
        }
    };

    if (isAuthLoading || isLoggingOut) {
        if (variant === 'navbar') {
            // Match the skeleton width to the flex-1 trigger so there's no layout jump.
            return (
                <Box p="sm">
                    <Group wrap="nowrap" gap="xs">
                        <Skeleton height={36} radius="sm" style={{ flex: 1 }} />
                        <ThemeToggle />
                    </Group>
                </Box>
            );
        }
        // Match the rendered authenticated trigger so we don't get a width
        // jump on hydration: Avatar (~24px) + name/email column + chevron.
        return <Skeleton height={36} width={180} radius="sm" />;
    }

    if (!isAuthenticated) {
        if (variant === 'navbar') {
            return (
                <Box p="sm">
                    <Group wrap="nowrap" gap="xs">
                        <Button
                            onClick={handleLogin}
                            leftSection={<IconLogin size={14} />}
                            variant="subtle"
                            style={{ flex: 1 }}
                        >
                            Login
                        </Button>
                        <ThemeToggle />
                    </Group>
                </Box>
            );
        }
        return (
            <Button onClick={handleLogin} leftSection={<IconLogin size={14} />} variant="subtle">
                Login
            </Button>
        );
    }

    const profileTitle = profilePages.length > 0 ? getPageTitle(profilePages[0]) : 'Profile';
    const profileChildren = profilePages[0]?.children || [];
    const triggerLabel = user?.name || profileTitle || 'Open user menu';

    const trigger = (
        <UnstyledButton aria-label={triggerLabel} style={variant === 'navbar' ? { flex: 1, minWidth: 0 } : undefined}>
            <Group gap="xs" wrap="nowrap">
                <Avatar radius="xl" size="sm" color="blue" aria-hidden="true">
                    {user?.name?.charAt(0)?.toUpperCase() || <IconUser size={14} />}
                </Avatar>
                <Box style={{ flex: 1, minWidth: 0 }} visibleFrom="sm">
                    <Text size="sm" fw={500} lh={1.2} truncate>
                        {user?.name || profileTitle}
                    </Text>
                    {user?.email && (
                        <Text size="xs" c="dimmed" lh={1.2} truncate>
                            {user.email}
                        </Text>
                    )}
                </Box>
                <IconChevronDown size={14} aria-hidden="true" />
            </Group>
        </UnstyledButton>
    );

    const dropdown = (
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
    );

    if (variant === 'navbar') {
        return (
            <Box p="sm">
                <Group wrap="nowrap" gap="xs">
                    <Box style={{ flex: 1, minWidth: 0 }}>
                        <Menu position="top-start" withArrow>
                            <Menu.Target>{trigger}</Menu.Target>
                            {dropdown}
                        </Menu>
                    </Box>
                    <ThemeToggle />
                </Group>
            </Box>
        );
    }

    return (
        <Menu position="bottom-end" withArrow>
            <Menu.Target>{trigger}</Menu.Target>
            {dropdown}
        </Menu>
    );
}
