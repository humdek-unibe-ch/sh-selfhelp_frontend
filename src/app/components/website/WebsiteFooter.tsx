'use client';

import { Group, Skeleton, Text, Container, Divider, Stack, Box } from '@mantine/core';
import { InternalLink } from '../shared/InternalLink';
import { useAppNavigation } from '../../../hooks/useAppNavigation';

function FooterSkeleton() {
    return (
        <Box w="100%" py="xl" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
            <Container size="xl">
                <Group justify="center" gap="xl">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} height={20} width={80} radius="sm" />
                    ))}
                </Group>
            </Container>
        </Box>
    );
}

export function WebsiteFooter() {
    const { footerPages, isLoading } = useAppNavigation();

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
                            >
                                {page.keyword}
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