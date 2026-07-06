/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState } from 'react';
import { Button, Group, Modal, Text } from '@mantine/core';
import { usePageContentValue } from '../../../../hooks/usePageContentValue';
import { useDeleteFormMutation } from '../../../../hooks/useFormSubmission';
import { type IEntryRecordDeleteStyle } from '../../../../types/common/styles.types';

interface IEntryRecordDeleteStyleProps {
    style: IEntryRecordDeleteStyle;
    cssClass: string;
}

/**
 * Read a hydrated CMS content field off the (untyped) style. The backend
 * injects `record_id` plus the confirmation labels into the `entry-record-delete`
 * subtree during entry hydration; they are not part of the static interface, so
 * we read them defensively from the top-level field-shaped props (and a `fields`
 * bag fallback), matching the mobile `readField` contract.
 */
const fieldText = (style: IEntryRecordDeleteStyle, name: string): string | undefined => {
    const holder = style as unknown as {
        [k: string]: { content?: unknown } | undefined;
        fields?: Record<string, { content?: unknown } | undefined>;
    };
    const raw = holder[name]?.content ?? holder.fields?.[name]?.content;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'number') return String(raw);
    return undefined;
};

/**
 * Delete trigger for an `entry-record`. Mirrors the mobile `EntryRecordDelete`
 * and the legacy web `jquery-confirm` UX: a destructive button that opens a
 * confirmation modal, then deletes the hydrated `record_id` through the shared
 * `useDeleteFormMutation` (which handles cache invalidation + notifications).
 * The surrounding `entry-record` disappears once the page query refetches.
 */
const EntryRecordDeleteStyle: React.FC<IEntryRecordDeleteStyleProps> = ({ style, cssClass }) => {
    const pageContent = usePageContentValue();
    const deleteMutation = useDeleteFormMutation();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    // `label_delete` is the style's catalog field (the generic `label` field is
    // not linked to entry-record-delete, so it can never carry CMS content here).
    const label = fieldText(style, 'label_delete') || 'Delete';
    const confirmTitle = fieldText(style, 'confirmation_title') || 'Delete entry?';
    const confirmMessage = fieldText(style, 'confirmation_message');
    const confirmContinue = fieldText(style, 'confirmation_continue') || 'Delete';
    const confirmCancel = fieldText(style, 'confirmation_cancel') || 'Cancel';

    const recordIdRaw = fieldText(style, 'record_id');
    const recordId = recordIdRaw !== undefined ? Number.parseInt(recordIdRaw, 10) : Number.NaN;
    const pageId = pageContent?.id;
    const sectionId = style.id;

    const canDelete = Number.isFinite(recordId) && typeof pageId === 'number';

    const onConfirm = async (): Promise<void> => {
        setConfirmOpen(false);
        if (!canDelete) return;
        setBusy(true);
        try {
            await deleteMutation.mutateAsync({
                record_id: recordId,
                page_id: pageId as number,
                section_id: sectionId,
            });
        } catch {
            // useDeleteFormMutation already surfaces an error notification.
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={cssClass}>
            <Button
                color="red"
                disabled={!canDelete || busy}
                loading={busy}
                onClick={() => setConfirmOpen(true)}
            >
                {label}
            </Button>
            <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title={confirmTitle} centered>
                {confirmMessage ? <Text mb="md">{confirmMessage}</Text> : null}
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setConfirmOpen(false)}>
                        {confirmCancel}
                    </Button>
                    <Button color="red" onClick={() => void onConfirm()}>
                        {confirmContinue}
                    </Button>
                </Group>
            </Modal>
        </div>
    );
};

export default EntryRecordDeleteStyle;
