/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Alert } from '@mantine/core';
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';

/**
 * The notices of a live page. The web client has no UI translation layer yet (every other notice
 * of the frontend is a constant English text too), so the texts live here in one place: when the
 * client gets one, these two lines move into it.
 */
export const LIVE_SYNC_NOTICE_TEXT = {
    lostTitle: 'This page changed for you',
    lost:
        'You no longer have access to this page, or it was removed. What you see is the last version you could ' +
        'open. It stays until you go to another page.',
    vanishedTitle: 'A form was changed',
    vanished:
        'A form you were filling in was changed or removed, so what you typed there is no longer part of this ' +
        'page and was not saved.',
} as const;

interface ILiveSyncNoticesProps {
    /** The server no longer lets this person open the page they are on (404, 403 or 401 on a live refetch). */
    lost: boolean;
    /** A form the person typed into is gone from the page. */
    vanishedForm: boolean;
    onDismissVanishedForm: () => void;
}

/**
 * Banners above a live page (decision "Banner, no kick-out"): the page stays on screen, the server
 * refuses the next write as it always does. Nothing is hidden or redirected by the client.
 */
export function LiveSyncNotices({ lost, vanishedForm, onDismissVanishedForm }: ILiveSyncNoticesProps) {
    if (!lost && !vanishedForm) {
        return null;
    }
    return (
        <>
            {lost && (
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    title={LIVE_SYNC_NOTICE_TEXT.lostTitle}
                    color="yellow"
                    mb="md"
                    role="alert"
                    data-testid="page-lost-notice"
                >
                    {LIVE_SYNC_NOTICE_TEXT.lost}
                </Alert>
            )}
            {vanishedForm && (
                <Alert
                    icon={<IconInfoCircle size={16} />}
                    title={LIVE_SYNC_NOTICE_TEXT.vanishedTitle}
                    color="yellow"
                    mb="md"
                    role="alert"
                    withCloseButton
                    onClose={onDismissVanishedForm}
                    data-testid="form-vanished-notice"
                >
                    {LIVE_SYNC_NOTICE_TEXT.vanished}
                </Alert>
            )}
        </>
    );
}
