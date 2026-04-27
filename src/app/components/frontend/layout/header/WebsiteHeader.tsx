import { Container, Group, Text, Flex } from '@mantine/core';
import { ThemeToggle } from '../../../shared/common/ThemeToggle';
import { AuthButton } from '../../../shared/auth/AuthButton';
import { LanguageSelector } from '../../../shared/common/LanguageSelector';
import { BurgerMenuClient } from '../../../shared/common/BurgerMenuClient';
import { WebsiteHeaderMenu } from './WebsiteHeaderMenu';
import {
    getMenuPagesSSR,
    getProfilePagesSSR,
    resolveLanguageSSR,
} from '../../../../_lib/server-fetch';

/**
 * Website header — **Server Component**.
 *
 * Resolves the active language and prefetches the public navigation tree on
 * the server, then renders the header HTML directly with the menu items
 * already in place. This eliminates the previous "language selector + theme
 * toggle render → menu pops in afterwards" flash: the menu is now part of
 * the very first painted frame.
 *
 * Interactive bits (language selector, auth button, hover dropdowns) live
 * inside `'use client'` children that hydrate into Mantine without
 * rebuilding the markup.
 *
 * The shared `getMenuPagesSSR` helper applies the same transform +
 * `selectMenuPages` as the client `useAppNavigation` `select`, so the SSR
 * HTML matches the post-hydration render char-for-char.
 */
export async function WebsiteHeader() {
    const { id: languageId } = await resolveLanguageSSR();
    // Both helpers share the same React-`cache()`'d
    // `/pages/language/{id}` round-trip, so this is one network call —
    // not two — even though we ask for two different slices.
    const [initialMenuPages, initialProfilePages] = languageId > 0
        ? await Promise.all([
              getMenuPagesSSR(languageId),
              getProfilePagesSSR(languageId),
          ])
        : [[], []];

    return (
        <Container size="xl" h="100%">
            <Flex justify="space-between" align="center" h="100%">
                <Text
                    size="xl"
                    fw={700}
                    c="blue"
                    className="cursor-pointer"
                >
                    Your Logo
                </Text>

                <WebsiteHeaderMenu initialMenuPages={initialMenuPages} />

                <Group gap="sm">
                    <LanguageSelector />
                    <ThemeToggle />
                    <AuthButton initialProfilePages={initialProfilePages} />
                    <BurgerMenuClient />
                </Group>
            </Flex>
        </Container>
    );
}
