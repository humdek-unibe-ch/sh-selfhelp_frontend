import { Box, Container, Divider, Group, Stack, Text } from '@mantine/core';
import { InternalLink } from '../../shared/ui/InternalLink';
import { ServerApi } from '../../../../api/server.api';
import { IPageItem } from '../../../../types/responses/frontend/frontend.types';

// Helper function to get page title
const getPageTitle = (item: IPageItem): string => {
    if (item.title && item.title.trim()) {
        return item.title;
    }
    return item.keyword.charAt(0).toUpperCase() + item.keyword.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');
};

/**
 * Server Component for Website Footer
 * Pre-fetches and renders footer navigation on the server
 */
export async function WebsiteFooterServer() {
    // Fetch frontend pages on server - default to language ID 1
    const frontendPages = await ServerApi.getFrontendPages(1);
    
    if (!frontendPages) {
        return null;
    }

    // Filter for footer pages
    const footerPages = frontendPages
        .filter((page: IPageItem) => page.footer_position !== null && !page.is_headless)
        .sort((a: IPageItem, b: IPageItem) => (a.footer_position ?? 0) - (b.footer_position ?? 0));

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
                        {footerPages.map((page: IPageItem) => (
                            <InternalLink
                                key={page.id_pages}
                                href={page.url || ''}
                                className="text-sm font-medium hover:text-blue-600 transition-colors"
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
