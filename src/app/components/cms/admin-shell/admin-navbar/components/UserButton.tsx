'use client';

import { 
    UnstyledButton, 
    Group, 
    Avatar, 
    Text, 
    Box,
    ActionIcon,
    Tooltip,
    useMantineColorScheme 
} from '@mantine/core';
import { IconChevronRight, IconSun, IconMoon } from '@tabler/icons-react';
import { useAuthUser } from '../../../../../../hooks/useUserData';
import { useRouter } from 'next/navigation';

export function UserButton() {
    const { user } = useAuthUser();
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const router = useRouter();

    const handleProfileClick = () => {
        router.push('/admin/profile');
    };

    return (
        <Box p="sm">
            <Group justify="space-between" wrap="nowrap" gap="xs">
                <UnstyledButton 
                    onClick={handleProfileClick}
                    style={{ 
                        flex: 1,
                        borderRadius: 'var(--mantine-radius-sm)',
                        padding: 'var(--mantine-spacing-xs)',
                        transition: 'background-color 0.15s ease',
                        minWidth: 0
                    }}
                    styles={{
                        root: {
                            '&:hover': {
                                backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
                            }
                        }
                    }}
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

                        <Box style={{ flex: 1, minWidth: 0 }}>
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
                
                <Tooltip label={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} theme`}>
                    <ActionIcon
                        onClick={toggleColorScheme}
                        variant="light"
                        size="md"
                        color="blue"
                        style={{ flexShrink: 0 }}
                    >
                        {colorScheme === 'dark' ? (
                            <IconSun size={18} />
                        ) : (
                            <IconMoon size={18} />
                        )}
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Box>
    );
}
