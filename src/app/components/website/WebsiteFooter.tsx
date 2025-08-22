'use client';

import { Box, Container, Divider, Group, Skeleton, Stack, Text } from '@mantine/core';
import { InternalLink } from '../shared/InternalLink';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { usePagePrefetch } from '../../../hooks/usePagePrefetch';
import { IPageItem } from '../../../types/responses/frontend/frontend.types';

// Helper function to get page title - use actual title from API or fallback to formatted keyword
const getPageTitle = (item: IPageItem): string => {
    // Use the actual title if available, otherwise format the keyword as fallback
    if (item.title && item.title.trim()) {
        return item.title;
    }
    // Fallback to formatted keyword
    return item.keyword.charAt(0).toUpperCase() + item.keyword.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');
};

function FooterSkeleton() {
    return (
        <Box component="footer" w="100%" py="xl">
            <Container size="xl">
                <Group justify="center" gap="xl">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} height={16} width={80} />
                    ))}
                </Group>
            </Container>
        </Box>
    );
}

export function WebsiteFooter() {
    const { footerPages, isLoading } = useAppNavigation();
    const { createHoverPrefetch } = usePagePrefetch();

    if (isLoading) {
        return <FooterSkeleton />;
    }

    if (footerPages.length === 0) {
        return null;
    }

    return (
        <Box 
            component="footer" 
            w="100%" 
            py="xl" 
            style={{ 
                backgroundColor: 'var(--mantine-color-gray-0)',
                borderTop: '1px solid var(--mantine-color-gray-3)'
            }}
        >
            <Container size="xl">
                <Stack gap="lg">
                    <Group justify="center" gap="xl">
                        {footerPages.map(page => (
                            <InternalLink
                                key={page.id_pages}
                                href={page.url}
                                className="text-sm font-medium hover:text-blue-600 transition-colors"
                                onMouseEnter={createHoverPrefetch(page.keyword)}
                            >
                                {getPageTitle(page)}
                            </InternalLink>
                        ))}
                    </Group>
                    
                    <Divider />
                    
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