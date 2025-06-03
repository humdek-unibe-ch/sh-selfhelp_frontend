'use client';

import { Container, Group, Burger, Text, Flex } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { WebsiteHeaderMenu } from './WebsiteHeaderMenu';
import { ThemeToggle } from '../common/ThemeToggle';
import { AuthButton } from '../auth/AuthButton';

export function WebsiteHeader() {
    const [opened, { toggle }] = useDisclosure(false);

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
                    <ThemeToggle />
                    <AuthButton />
                    <Burger
                        opened={opened}
                        onClick={toggle}
                        size="sm"
                        hiddenFrom="sm"
                    />
                </Group>
            </Flex>
        </Container>
    );
}
