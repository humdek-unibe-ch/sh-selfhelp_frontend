/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Alert, Button, Group } from '@mantine/core';
import type { IFormListFailure } from '../../../../../shared';
import { FORM_LIST_TEXT } from './form-list.constants';

interface IFormListErrorStateProps {
    failure: IFormListFailure;
    /** Read the state again. */
    onRetry: () => void;
    /** Drop the list's URL parameters and show the whole list. */
    onShowAll: () => void;
}

/** What to tell the visitor for a refusal; the reason is the server's stable code. */
function messageOf(failure: IFormListFailure): string {
    if (failure.status === 401 || failure.reason === 'login_required') {
        return FORM_LIST_TEXT.loginRequired;
    }
    if (failure.status === 403) {
        return FORM_LIST_TEXT.forbidden;
    }
    if (failure.status === 404) {
        return FORM_LIST_TEXT.notFound;
    }
    if (failure.status === 400) {
        return FORM_LIST_TEXT.invalidLink;
    }
    return FORM_LIST_TEXT.loadFailed;
}

/**
 * The list's error state: the page is served, this list says why it cannot
 * be drawn. A bad link offers the whole list; a failed read offers a retry.
 */
export function FormListErrorState({ failure, onRetry, onShowAll }: IFormListErrorStateProps) {
    const canRetry = failure.status === 0 || failure.status >= 500;
    const canShowAll = failure.status === 400 || failure.status === 403 || failure.status === 404;

    return (
        <Alert color="red" role="alert" data-testid="form-list-error" data-reason={failure.reason}>
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <span>{messageOf(failure)}</span>
                <Group gap="xs">
                    {canRetry && (
                        <Button size="compact-sm" variant="light" onClick={onRetry}>{FORM_LIST_TEXT.retry}</Button>
                    )}
                    {canShowAll && failure.status !== 401 && (
                        <Button size="compact-sm" variant="light" onClick={onShowAll}>{FORM_LIST_TEXT.showAll}</Button>
                    )}
                </Group>
            </Group>
        </Alert>
    );
}
