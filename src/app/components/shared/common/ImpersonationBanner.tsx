'use client';

import { Affix, Alert, Button, Group, Loader, Text } from '@mantine/core';
import { IconUserOff } from '@tabler/icons-react';
import { useAuth } from '../../../../hooks/useAuth';
import { useStopImpersonate } from '../../../../hooks/useUsers';

/**
 * Floating banner that lets an admin see — and end — an active
 * impersonation session.
 *
 * Mounted **once** at the root client boundary in `ClientProviders`,
 * so it renders on every page — admin chrome AND the public website —
 * without ever being duplicated. The banner self-hides via an early
 * `return null` while there is no active impersonation, so the cost
 * on every other page is one cheap Zustand subscription.
 *
 * Why "every page"? Impersonation exists primarily to reproduce
 * user-facing bugs on the public site (a CMS form behaving oddly for
 * a specific user, an ACL combination producing the wrong menu, etc.).
 * Limiting the banner to the admin shell would mean the moment the
 * admin navigates to the page they are debugging they no longer see
 * which user they are pretending to be — exactly when the visual cue
 * is most needed.
 *
 * State source of truth: `useImpersonationStore` (via `useAuth`),
 * which is driven by Mercure `impersonation-status` events on the
 * per-user topic plus a local `setTimeout(expires_in)` safety-net.
 * No polling.
 *
 * We intentionally do not read or write the impersonation JWT here —
 * it's httpOnly and only the BFF route
 * `/api/admin/users/stop-impersonate` is allowed to clear it.
 */
export function ImpersonationBanner() {
    const { isImpersonating, targetUser } = useAuth();
    const stopMutation = useStopImpersonate();

    if (!isImpersonating) return null;

    const handleStop = () => stopMutation.mutate();

    return (
        <Affix position={{ bottom: 20, right: 20 }}>
            <Alert
                color="orange"
                variant="filled"
                w={320}
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
            >
                <Group justify="space-between" wrap="nowrap">
                    <div>
                        <Text size="sm" fw={700}>
                            Impersonating
                        </Text>
                        <Text size="xs">{targetUser?.email}</Text>
                    </div>
                    <Button
                        size="xs"
                        color="white"
                        variant="outline"
                        leftSection={
                            stopMutation.isPending ? <Loader size={12} color="white" /> : <IconUserOff size={12} />
                        }
                        onClick={handleStop}
                        disabled={stopMutation.isPending}
                    >
                        Stop
                    </Button>
                </Group>
            </Alert>
        </Affix>
    );
}
