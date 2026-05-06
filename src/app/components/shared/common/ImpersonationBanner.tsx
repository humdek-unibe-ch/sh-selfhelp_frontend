'use client';

import { Alert, Group, Button, Text, Affix } from '@mantine/core';
import { IconUserOff } from '@tabler/icons-react';
import { useAuth } from '../../../../hooks/useAuth';

export function ImpersonationBanner() {
    const { isImpersonating, targetUser, stopImpersonation } = useAuth();

    if (!isImpersonating) return null;

    return (
        <Affix position={{ bottom: 20, right: 20 }}>
            <Alert
                color="orange"
                variant="filled"
                w={300}
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
            >
                <Group justify="space-between" wrap="nowrap">
                    <div>
                        <Text size="sm" fw={700}>
                            Impersonating
                        </Text>
                        <Text size="xs">
                            {targetUser?.email}
                        </Text>
                    </div>
                    <Button
                        size="xs"
                        color="white"
                        variant="outline"
                        leftSection={<IconUserOff size={12} />}
                        onClick={stopImpersonation}
                    >
                        Stop
                    </Button>
                </Group>
            </Alert>
        </Affix>
    );
}