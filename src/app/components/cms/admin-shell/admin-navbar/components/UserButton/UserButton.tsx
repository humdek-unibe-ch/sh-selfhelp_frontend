'use client';

import {
    UnstyledButton,
    Group,
    Avatar,
    Text,
    Box
} from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '../../../../../../../hooks/useUserData';
import { ThemeToggle } from '../../../../../shared';
import styles from './UserButton.module.css';

export function UserButton() {
    const { user } = useAuthUser();
    const router = useRouter();

    const handleProfileClick = () => {
        router.push('/admin/profile');
    };

    return (
        <Box p="sm">
            <Group justify="space-between" wrap="nowrap" gap="xs">
                <UnstyledButton
                    onClick={handleProfileClick}
                    className={styles.userButton}
                    p="xs"
                >
                    <Group wrap="nowrap" gap="xs">
                        <Avatar
                            src={null}
                            radius="xl"
                            size="sm"
                            color="blue"
                        >
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>

                        <Box className={styles.userInfo}>
                            <Text size="sm" fw={500} truncate>
                                {user?.name || 'User'}
                            </Text>
                            <Text c="dimmed" size="xs" truncate>
                                {user?.email || 'user@example.com'}
                            </Text>
                        </Box>

                        <IconChevronRight size={12} color="var(--mantine-color-gray-6)" />
                    </Group>
                </UnstyledButton>

                <ThemeToggle />
            </Group>
        </Box>
    );
}
