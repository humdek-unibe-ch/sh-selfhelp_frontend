'use client';

import { Container, Group, Text, Flex } from '@mantine/core';
import { WebsiteHeaderMenu } from './WebsiteHeaderMenu';
import { BurgerMenuClient, LanguageSelector, ThemeToggle } from '../../shared';
import { AuthButton } from '../../shared/auth';

/**
 * Website Header with optimized loading behavior
 */
export function WebsiteHeader() {
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

                <WebsiteHeaderMenu />
                
                <Group gap="sm">
                    <LanguageSelector />
                    <ThemeToggle />
                    <AuthButton />
                    <BurgerMenuClient />
                </Group>
            </Flex>
        </Container>
    );
}
