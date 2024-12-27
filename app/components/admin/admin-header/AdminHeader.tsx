'use client';

import { Burger, Group } from '@mantine/core';
import { SelfHelpLogo } from '../../common/SelfHelpLogo';
import { ThemeToggle } from '../../common/ThemeToggle';

interface AdminHeaderProps {
    opened: boolean;
    onToggle: () => void;
}

export function AdminHeader({ opened, onToggle }: AdminHeaderProps): JSX.Element {
    return (
        <Group h="100%" px="md" justify="space-between">
            <Group>
                <Burger opened={opened} onClick={onToggle} hiddenFrom="sm" size="sm" />
                <SelfHelpLogo size={40} />
            </Group>
            <ThemeToggle />
        </Group>
    );
}
