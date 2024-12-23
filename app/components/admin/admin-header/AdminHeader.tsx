'use client';

import { Burger, Container, Group } from '@mantine/core';
import classes from './AdminHeader.module.css';
import { useDisclosure } from '@mantine/hooks';
import { SelfHelpLogo } from '../../common/SelfHelpLogo';

export function AdminHeader() {
    const [opened, { toggle }] = useDisclosure();

    return (
        <Group h="100%" px="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <SelfHelpLogo size={40} />
        </Group>
    );
}
