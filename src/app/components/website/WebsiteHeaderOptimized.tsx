'use client';

import { Container, Group, Text, Flex } from '@mantine/core';
import { ThemeToggle } from '../common/ThemeToggle';
import { AuthButton } from '../auth/AuthButton';
import { LanguageSelector } from '../common/LanguageSelector';
import { BurgerMenuClient } from '../common/BurgerMenuClient';
import { WebsiteHeaderMenu } from './WebsiteHeaderMenu';

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
