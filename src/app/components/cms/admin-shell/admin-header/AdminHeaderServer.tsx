import { Group, Text, Flex } from '@mantine/core';
import { BurgerMenuClient } from '../../../shared/common/BurgerMenuClient';
import { ThemeToggleClient } from '../../../shared/common/ThemeToggleClient';
import { LanguageSelectorClient } from '../../../shared/common/LanguageSelectorClient';
import { AdminUserMenuClient } from './AdminUserMenuClient';

interface IAdminHeaderServerProps {
    userData: any;
}

/**
 * Server Component for Admin Header
 * Renders static header structure with client components for interactivity
 */
export function AdminHeaderServer({ userData }: IAdminHeaderServerProps) {
    return (
        <Flex h="100%" px="md" justify="space-between" align="center">
            <Group>
                <BurgerMenuClient />
                <Text size="lg" fw={700} c="blue">
                    SelfHelp Admin
                </Text>
            </Group>
            
            <Group gap="sm">
                <LanguageSelectorClient />
                <ThemeToggleClient />
                <AdminUserMenuClient userData={userData} />
            </Group>
        </Flex>
    );
}
