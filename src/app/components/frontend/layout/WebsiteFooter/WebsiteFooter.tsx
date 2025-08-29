'use client';

import { Box, Container, Divider, Group, Stack, Text } from '@mantine/core';
import { InternalLink } from '../../../shared/ui/InternalLink';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { usePagePrefetch } from '../../../../../hooks/usePagePrefetch';
import { IPageItem } from '../../../../../types/responses/frontend/frontend.types';
import styles from './WebsiteFooter.module.css';

// Helper function to get page title
const getPageTitle = (item: IPageItem): string => {
    if (item.title && item.title.trim()) {
        return item.title;
    }
    return item.keyword.charAt(0).toUpperCase() + item.keyword.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');
};

/**
 * Website Footer with optimized loading behavior
 */
export function WebsiteFooter() {
    const { footerPages, isLoading } = useAppNavigation();
    const { createHoverPrefetch } = usePagePrefetch();

    // Show nothing while loading to prevent layout shift
    if (isLoading || footerPages.length === 0) {
        return null;
    }

    return (
        <Box
            component="footer"
            w="100%"
            py="xl"
            className={styles.footer}
        >
            <Container size="xl">
                <Stack gap="lg">
                    <Group justify="center" gap="xl">
                        {footerPages.map(page => (
                            <InternalLink
                                key={page.id_pages}
                                href={page.url}
                                className="text-sm font-medium hover:text-blue-600 transition-colors"
                                onMouseEnter={createHoverPrefetch(page.id_pages)}
                            >
                                {getPageTitle(page)}
                            </InternalLink>
                        ))}
                    </Group>

                    <Text
                        size="sm"
                        c="dimmed"
                        ta="center"
                    >
                        © {new Date().getFullYear()} Self Help. All rights reserved.
                    </Text>
                </Stack>
            </Container>
        </Box>
    );
}
