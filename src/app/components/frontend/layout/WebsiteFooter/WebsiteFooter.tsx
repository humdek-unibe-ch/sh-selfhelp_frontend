'use client';

import { Box, Container, Group, Stack, Text } from '@mantine/core';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { usePagePrefetch } from '../../../../../hooks/usePagePrefetch';
import styles from './WebsiteFooter.module.css';
import { InternalLink } from '../../../shared';
import { getPageTitle } from '../../../../../utils/navigation.utils';

/**
 * Website Footer with optimized loading behavior
 */
export function WebsiteFooter() {
    const { footerPages, isLoading } = useAppNavigation();
    const { createHoverPrefetch } = usePagePrefetch();

    // Render the footer shell even while the navigation query resolves so
    // the privacy / legal link stays reachable on every page. Previously we
    // returned `null` when CMS-backed footer links were empty, which hid
    // the privacy link too.
    const showCmsLinks = !isLoading && footerPages.length > 0;

    return (
        <Box component="footer" w="100%" py="xl" className={styles.footer}>
            <Container size="xl">
                <Stack gap="lg">
                    <Group justify="center" gap="xl">
                        {showCmsLinks &&
                            footerPages.map((page) => (
                                <InternalLink
                                    key={page.id_pages}
                                    href={page.url || ''}
                                    className="text-sm font-medium hover:text-blue-600 transition-colors"
                                    onMouseEnter={page.keyword ? createHoverPrefetch(page.keyword) : undefined}
                                >
                                    {getPageTitle(page)}
                                </InternalLink>
                            ))}
                        <InternalLink
                            href="/privacy"
                            className="text-sm font-medium hover:text-blue-600 transition-colors"
                        >
                            Privacy & cookies
                        </InternalLink>
                    </Group>

                    <Text size="sm" c="dimmed" ta="center">
                        © {new Date().getFullYear()} SelfHelp. All rights reserved.
                    </Text>
                </Stack>
            </Container>
        </Box>
    );
}
