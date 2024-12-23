'use client';

import { Burger, Container, Group, Text } from '@mantine/core';
import classes from './AdminHeader.module.css';
import { useDisclosure } from '@mantine/hooks';

export function AdminHeader() {
    const [opened, { toggle }] = useDisclosure();

    return (
        <Group h="100%" px="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            {/* <MantineLogo size={30} /> */}
        </Group>
    );
}
