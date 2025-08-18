import { Container, Group, Text, Flex } from '@mantine/core';
import { WebsiteHeaderMenuServer } from './WebsiteHeaderMenuServer';
import { LanguageSelectorClient } from '../common/LanguageSelectorClient';
import { ThemeToggleClient } from '../common/ThemeToggleClient';
import { AuthButtonClient } from '../auth/AuthButtonClient';
import { BurgerMenuClient } from '../common/BurgerMenuClient';

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
                    <LanguageSelectorClient />
                    <ThemeToggleClient />
                    <AuthButtonClient />
                    <BurgerMenuClient />
                </Group>
            </Flex>
        </Container>
    );
}
