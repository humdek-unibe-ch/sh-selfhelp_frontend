/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import type { ReactNode } from 'react';
import { Button, Group, Modal, Stack } from '@mantine/core';

interface IFormListConfirmDialogProps {
    opened: boolean;
    title: string;
    /** What is about to happen, in plain words. */
    children: ReactNode;
    confirmLabel: string;
    cancelLabel: string;
    confirmColor?: string;
    /** The confirmed action is running: the buttons wait. */
    busy?: boolean;
    /** Why the action did not happen (a conflict, a refusal); shown above the buttons. */
    notice?: ReactNode;
    /** Hide the confirm button (the notice says what to do instead). */
    hideConfirm?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * The one confirmation dialog of the lists: delete, a quick action with a
 * confirmation, and "discard your changes". Cancel has the initial focus, so
 * pressing Enter right away never destroys anything.
 */
export function FormListConfirmDialog({
    opened,
    title,
    children,
    confirmLabel,
    cancelLabel,
    confirmColor = 'red',
    busy = false,
    notice,
    hideConfirm = false,
    onConfirm,
    onCancel,
}: IFormListConfirmDialogProps) {
    return (
        <Modal
            opened={opened}
            onClose={busy ? () => undefined : onCancel}
            title={title}
            centered
            size="sm"
            closeOnClickOutside={!busy}
            // Mantine closes a modal on Escape from a window listener that reads the newest props when the key
            // arrives. A question that was asked by pressing Escape in another dialog would receive that same key
            // press and close itself the moment it opened. Escape is answered here, inside the dialog, instead.
            closeOnEscape={false}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && !event.nativeEvent.isComposing && !busy) {
                    event.stopPropagation();
                    onCancel();
                }
            }}
            trapFocus
            returnFocus
        >
            <Stack gap="md">
                <div>{children}</div>
                {notice}
                <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={onCancel} disabled={busy} data-autofocus>
                        {cancelLabel}
                    </Button>
                    {!hideConfirm && (
                        <Button color={confirmColor} onClick={onConfirm} loading={busy}>
                            {confirmLabel}
                        </Button>
                    )}
                </Group>
            </Stack>
        </Modal>
    );
}
