import { Container, Group, Text, Flex } from '@mantine/core';
import { WebsiteHeaderMenuServer } from './WebsiteHeaderMenuServer';
import { LanguageSelector } from '../../shared/common/LanguageSelector';
import { ThemeToggleClient } from '../../shared/common/ThemeToggleClient';
import { AuthButtonClient } from '../../shared/auth/AuthButtonClient';
import { BurgerMenuClient } from '../../shared/common/BurgerMenuClient';

/**
 * Server Component for Website Header
 * Renders static structure on server, includes client components for interactivity
 */
export function WebsiteHeaderServer() {
    return (
        <Container size="xl" h="100%">
            <Flex justify="space-between" align="center" h="100%">
                <Text
                    size="xl"
                    fw={700}
                    c="blue"
                    style={{ cursor: 'pointer' }}
                >
                    Your Logo
                </Text>

                <WebsiteHeaderMenuServer />
                
                <Group gap="sm">
                    <LanguageSelector />
                    <ThemeToggleClient />
                    <AuthButtonClient />
                    <BurgerMenuClient />
                </Group>
            </Flex>
        </Container>
    );
}
