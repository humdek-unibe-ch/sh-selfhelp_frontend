/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import Link from 'next/link';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { IconEye, IconHistory, IconPencil, IconTrash } from '@tabler/icons-react';
import type { IFormListQuickActionInfo, IFormListRow } from '../../../../../shared';
import { FORM_LIST_TEXT } from './form-list.constants';

export type TFormListOpenTab = 'details' | 'history';

interface IFormListRowActionsProps {
    row: IFormListRow;
    /** The record's short name, used in accessible names ("Edit Write report"). */
    label: string;
    /** `entry-form-list` draws the write actions; `data-view` only links to the detail page. */
    kind: 'entry-form-list' | 'data-view';
    /** The list offers history (`show_history` and the server's capability). */
    historyOffered: boolean;
    /** The quick actions of the list; the row says which of them apply. */
    quickActions: readonly IFormListQuickActionInfo[];
    onOpen: (mode: 'view' | 'edit', tab: TFormListOpenTab) => void;
    onDelete: () => void;
    onQuickAction: (action: IFormListQuickActionInfo) => void;
}

/**
 * True when a row has anything to offer, so the actions column is needed. A
 * record of an entry list can always be opened; a data view row only links to
 * its detail page when the author set one.
 */
export function rowHasActions(row: IFormListRow, kind: 'entry-form-list' | 'data-view'): boolean {
    return kind === 'entry-form-list' || row.detail_url !== null;
}

/**
 * What the visitor may do with one record. The row's flags are the server's
 * rendering hints (the server checks again on every write); quick actions are
 * offered only when the row lists them.
 */
export function FormListRowActions({
    row,
    label,
    kind,
    historyOffered,
    quickActions,
    onOpen,
    onDelete,
    onQuickAction,
}: IFormListRowActionsProps) {
    if (kind === 'data-view') {
        if (row.detail_url === null) {
            return null;
        }
        return (
            <Button
                component={Link}
                href={row.detail_url}
                size="compact-sm"
                variant="light"
                aria-label={`${FORM_LIST_TEXT.view} ${label}`}
            >
                {FORM_LIST_TEXT.view}
            </Button>
        );
    }

    const applicable = quickActions.filter((action) => row.quick_actions.includes(action.id));

    return (
        <>
            <Tooltip label={FORM_LIST_TEXT.view} withArrow>
                <ActionIcon
                    variant="subtle"
                    aria-label={`${FORM_LIST_TEXT.view} ${label}`}
                    onClick={() => onOpen('view', 'details')}
                >
                    <IconEye size={16} aria-hidden="true" />
                </ActionIcon>
            </Tooltip>
            {row.can_update && (
                <Tooltip label={FORM_LIST_TEXT.edit} withArrow>
                    <ActionIcon
                        variant="subtle"
                        aria-label={`${FORM_LIST_TEXT.edit} ${label}`}
                        onClick={() => onOpen('edit', 'details')}
                    >
                        <IconPencil size={16} aria-hidden="true" />
                    </ActionIcon>
                </Tooltip>
            )}
            {historyOffered && row.can_view_history && (
                <Tooltip label={FORM_LIST_TEXT.history} withArrow>
                    <ActionIcon
                        variant="subtle"
                        aria-label={`${FORM_LIST_TEXT.history} ${label}`}
                        onClick={() => onOpen('view', 'history')}
                    >
                        <IconHistory size={16} aria-hidden="true" />
                    </ActionIcon>
                </Tooltip>
            )}
            {applicable.map((action) => (
                <Button
                    key={action.id}
                    size="compact-xs"
                    variant="light"
                    onClick={() => onQuickAction(action)}
                    aria-label={`${action.label} ${label}`}
                >
                    {action.label}
                </Button>
            ))}
            {row.can_delete && (
                <Tooltip label={FORM_LIST_TEXT.delete} withArrow>
                    <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={`${FORM_LIST_TEXT.delete} ${label}`}
                        onClick={onDelete}
                    >
                        <IconTrash size={16} aria-hidden="true" />
                    </ActionIcon>
                </Tooltip>
            )}
        </>
    );
}
