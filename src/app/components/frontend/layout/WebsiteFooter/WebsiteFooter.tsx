'use client';

import { Box, Container, Group, Stack, Text } from '@mantine/core';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { usePagePrefetch } from '../../../../../hooks/usePagePrefetch';
import styles from './WebsiteFooter.module.css';
import { InternalLink } from '../../../shared';
import { getPageTitle } from '../../../../../utils/navigation.utils';

/**
 * Website Footer with optimized loading behavior.
 *
 * All footer links are now CMS-driven via `footer_position` on the page row
 * (see `useAppNavigation().footerPages`). The privacy notice ships as a
 * seeded CMS page (`pages.keyword = 'privacy'`, `is_system = 1`) so it always
 * appears here unless an admin explicitly clears its `footer_position` —
 * which is the same single source of truth the impressum / agb / disclaimer
 * pages already use.
 */
export function WebsiteFooter() {
    const { footerPages } = useAppNavigation();
    const { createHoverPrefetch } = usePagePrefetch();

    return (
        <Box component="footer" w="100%" py="xl" className={styles.footer}>
            <Container size="xl">
                <Stack gap="lg">
                    <Group justify="center" gap="xl">
                        {footerPages.map((page) => (
                            <InternalLink
                                key={page.id_pages}
                                href={page.url || ''}
                                className="text-sm font-medium hover:text-blue-600 transition-colors"
                                onMouseEnter={
                                    page.keyword ? createHoverPrefetch(page.keyword) : undefined
                                }
                            >
                                {getPageTitle(page)}
                            </InternalLink>
                        ))}
                    </Group>

                    <Text size="sm" c="dimmed" ta="center">
                        © {new Date().getFullYear()} SelfHelp. All rights reserved.
                    </Text>
                </Stack>
            </Container>
        </Box>
    );
}
