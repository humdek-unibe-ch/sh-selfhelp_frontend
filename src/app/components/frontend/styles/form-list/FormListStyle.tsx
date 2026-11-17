/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Group, Modal, Pagination, Paper, Skeleton, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import {
    getFormStaleVersion,
    nextSortOnHeaderClick,
    type IFormListQuickActionInfo,
    type IFormListRow,
    type IFormListSelected,
    type IFormStaleVersionData,
} from '../../../../../shared';
import {
    useFormListDeleteMutation,
    useFormListQuickActionMutation,
    useFormListState,
} from '../../../../../hooks/useFormList';
import { invalidateFormList } from '../../../../../utils/form-list-cache.utils';
import { useFormListUrlState } from '../../../../../hooks/useFormListUrlState';
import { usePageContentValue } from '../../../../../hooks/usePageContentValue';
import { useUnsavedChangesGuard } from '../../../../../hooks/useUnsavedChangesGuard';
import { rowLabel } from '../../../../../utils/form-list.utils';
import type { IDataViewStyle, IEntryFormListStyle, TStyle } from '../../../../../types/common/styles.types';
import { useLanguageContext } from '../../../contexts/LanguageContext';
import { usePreviewMode } from '../../../contexts/PreviewModeContext';
import { FormListConfirmDialog } from './FormListConfirmDialog';
import { FormListErrorState } from './FormListErrorState';
import type { IFormListFormContext, IFormListFormSaved } from './FormListFormContext';
import { FormListRecord } from './FormListRecord';
import { FormListCards, FormListCustom, FormListTable } from './FormListRows';
import { FormListRowActions, rowHasActions, type TFormListOpenTab } from './FormListRowActions';
import { useFormListSeed } from './FormListSsrContext';
import { FormListToolbar } from './FormListToolbar';
import { FORM_LIST_COMPACT_QUERY, FORM_LIST_TEXT } from './form-list.constants';
import type { TFormListPanel } from './form-list.types';
import styles from './FormList.module.css';

interface IFormListStyleProps {
    style: IEntryFormListStyle | IDataViewStyle;
    styleProps?: Record<string, unknown>;
    cssClass?: string;
}

/** The inline form of a list: the section whose id the server named, searched breadth-first in the list's children. */
function findFormChild(children: TStyle[] | undefined, formSectionId: number | null): TStyle | null {
    if (formSectionId === null) {
        return null;
    }
    let level: TStyle[] = children ?? [];
    while (level.length > 0) {
        const next: TStyle[] = [];
        for (const child of level) {
            if (child && child.id === formSectionId) {
                return child;
            }
            if (child?.children) {
                next.push(...child.children);
            }
        }
        level = next;
    }
    return null;
}

interface IDeleteTarget {
    recordId: number;
    version: number;
    label: string;
}

interface IQuickTarget {
    action: IFormListQuickActionInfo;
    row: IFormListRow;
    label: string;
}

/**
 * `entry-form-list` and `data-view`: a server-rendered list of records of the
 * generic data store.
 *
 * The server decides, this draws: rows, columns, controls, capabilities and
 * per-row permissions come from `list_state`; the client never evaluates
 * access, conditions or filters. The page URL is the list's state
 * (`<key>.page`, `<key>.q`, `<key>.record`, ...), so refresh, Back/Forward
 * and a shared link all land on the same view, and two lists on one page
 * never touch each other's parameters. Create and edit use the list's inline
 * form section through the ordinary form endpoints.
 */
const FormListStyle: React.FC<IFormListStyleProps> = ({ style, cssClass }) => {
    const queryClient = useQueryClient();
    const pageContent = usePageContentValue();
    const { currentLanguageId } = useLanguageContext();
    const { isPreviewMode } = usePreviewMode();
    const compact = useMediaQuery(FORM_LIST_COMPACT_QUERY);

    const sectionId = style.id;
    const pageId = pageContent?.id ?? 0;
    const listKey = style.list_key?.content?.trim() ?? '';
    const isEntryList = style.style_name === 'entry-form-list';
    const heading = style.title?.content;

    const url = useFormListUrlState(listKey);
    const { navigate, urlState } = url;
    const seed = useFormListSeed(sectionId, listKey, url.search, style.list_state, style.list_error);
    const list = useFormListState({
        pageId: listKey === '' ? 0 : pageId,
        sectionId,
        listKey,
        languageId: currentLanguageId,
        search: url.search,
        seed,
        preview: isPreviewMode,
        route: pageContent?.route_params ?? null,
    });
    const state = list.state;

    // -- what the URL asks to show ------------------------------------------------
    const mode = urlState.mode;
    const openRecord = urlState.record;
    const selected = state?.selected ?? null;
    // History loads the same selected record as view; only the open tab differs.
    const selectedMatches = selected !== null && selected.record_id === openRecord
        && (selected.mode === mode || (mode === 'history' && selected.mode === 'history') || (mode === 'view' && selected.mode === 'view'));

    // The record being edited is a snapshot: a background refresh or somebody
    // else's change must never replace what the person is typing. It is renewed
    // only on purpose ("load the latest version").
    const [frozen, setFrozen] = useState<IFormListSelected | null>(null);
    if (mode === 'edit' && openRecord !== null) {
        if (selectedMatches && selected !== null && (frozen === null || frozen.record_id !== openRecord)) {
            setFrozen(selected);
        }
    } else if (frozen !== null) {
        setFrozen(null);
    }

    const [conflict, setConflict] = useState<IFormStaleVersionData | null>(null);
    // After "keep my changes": the version the next save is based on.
    const [versionOverride, setVersionOverride] = useState<number | null>(null);
    // Bumped to rebuild the inline form from scratch (load the latest version).
    const [formEpoch, setFormEpoch] = useState(0);
    const [tab, setTab] = useState<TFormListOpenTab>(mode === 'history' ? 'history' : 'details');
    const [announcement, setAnnouncement] = useState('');
    const [notice, setNotice] = useState<{ tone: 'conflict' | 'error'; message: string } | null>(null);

    // Keep the history tab in sync with a deep link (`?key.mode=history`).
    // Render-phase update (same pattern as `frozen` above) — not an effect —
    // so eslint react-hooks/set-state-in-effect stays clean.
    const [tabForMode, setTabForMode] = useState(mode);
    if (mode !== tabForMode) {
        setTabForMode(mode);
        if (mode === 'history') {
            setTab('history');
        } else if (mode === 'view') {
            setTab('details');
        }
    }

    const panel: TFormListPanel | null = useMemo(() => {
        if (mode === null) {
            return null;
        }
        if (mode === 'create') {
            return { kind: 'create' };
        }
        if (openRecord === null) {
            return null;
        }
        if (mode === 'edit' && frozen !== null && frozen.record_id === openRecord) {
            return { kind: 'edit', selected: frozen };
        }
        if ((mode === 'view' || mode === 'history') && selectedMatches && selected !== null) {
            return { kind: 'view', selected };
        }
        if (list.isFetching || list.isPlaceholder || list.isLoading) {
            return { kind: 'loading', mode };
        }
        return { kind: 'unavailable' };
    }, [mode, openRecord, frozen, selectedMatches, selected, list.isFetching, list.isPlaceholder, list.isLoading]);

    const panelKind = panel?.kind ?? null;
    const formChild = useMemo(
        () => findFormChild(style.children, state?.list.form_section_id ?? null),
        [style.children, state?.list.form_section_id],
    );
    const presentation = state?.list.form_presentation ?? (style.style_name === 'entry-form-list' ? (style.form_presentation?.content ?? 'modal') : 'modal');
    const historyOffered = isEntryList && style.style_name === 'entry-form-list' && style.show_history?.content === '1' && Boolean(state?.capabilities.history);

    // -- leaving a form with unsaved input ----------------------------------------------
    const dirtyCheckRef = useRef<(() => boolean) | null>(null);
    const registerDirtyCheck = useCallback((check: (() => boolean) | null) => {
        dirtyCheckRef.current = check;
    }, []);
    const isDirty = useCallback(() => dirtyCheckRef.current?.() ?? false, []);
    const [discard, setDiscard] = useState<{ proceed: () => void } | null>(null);
    const leave = useCallback((proceed: () => void) => {
        if (isDirty()) {
            setDiscard({ proceed });
        } else {
            proceed();
        }
    }, [isDirty]);

    useUnsavedChangesGuard({
        active: panelKind === 'create' || panelKind === 'edit',
        currentHref: url.search === '' ? url.pathname : `${url.pathname}?${url.search}`,
        isDirty,
        onBlocked: (proceed) => setDiscard({ proceed }),
    });

    const announce = useCallback((message: string) => {
        setAnnouncement(message);
    }, []);

    useEffect(() => {
        if (announcement === '') {
            return undefined;
        }
        const timer = window.setTimeout(() => setAnnouncement(''), 5000);
        return () => window.clearTimeout(timer);
    }, [announcement]);

    const closeRecord = useCallback(() => {
        dirtyCheckRef.current = null;
        setConflict(null);
        setVersionOverride(null);
        setTab('details');
        navigate({ type: 'close' });
    }, [navigate]);

    const requestClose = useCallback(() => leave(closeRecord), [leave, closeRecord]);

    const handleSaved = useCallback((result: IFormListFormSaved) => {
        const message = result.created ? FORM_LIST_TEXT.created : FORM_LIST_TEXT.saved;
        announce(message);
        notifications.show({ title: message, message: '', color: 'green' });
        void invalidateFormList(queryClient);
        closeRecord();
    }, [announce, closeRecord, queryClient]);

    const reloadLatest = useCallback(() => {
        leave(() => {
            void invalidateFormList(queryClient).then(() => {
                dirtyCheckRef.current = null;
                setFrozen(null);
                setConflict(null);
                setVersionOverride(null);
                setFormEpoch((value) => value + 1);
            });
        });
    }, [leave, queryClient]);

    const keepDraft = useCallback(() => {
        if (conflict === null) {
            return;
        }
        setVersionOverride(conflict.current_version);
        setConflict(null);
        announce(FORM_LIST_TEXT.conflictKeepHint);
        notifications.show({ message: FORM_LIST_TEXT.conflictKeepHint, color: 'orange' });
    }, [conflict, announce]);

    const editing = panel?.kind === 'edit' ? panel.selected : null;
    const formContext = useMemo<IFormListFormContext | null>(() => {
        if (panelKind !== 'create' && panelKind !== 'edit') {
            return null;
        }
        return {
            recordId: editing?.record_id ?? null,
            prefill: editing?.form_values ?? null,
            expectedVersion: editing ? (versionOverride ?? editing.version) : null,
            onSaved: handleSaved,
            onStale: setConflict,
            onCancel: requestClose,
            registerDirtyCheck,
        };
    }, [panelKind, editing, versionOverride, handleSaved, requestClose, registerDirtyCheck]);

    // -- opening records, deleting, quick actions ------------------------------------
    const openRecordFromRow = useCallback((row: IFormListRow, openMode: 'view' | 'edit', openTab: TFormListOpenTab) => {
        setTab(openTab);
        setConflict(null);
        setVersionOverride(null);
        const urlMode = openTab === 'history' ? 'history' : openMode;
        navigate({ type: 'open', record: row.record_id, mode: urlMode });
    }, [navigate]);

    const switchRecordTab = useCallback((next: TFormListOpenTab) => {
        setTab(next);
        if (openRecord !== null && (mode === 'view' || mode === 'history')) {
            navigate({ type: 'open', record: openRecord, mode: next === 'history' ? 'history' : 'view' });
        }
    }, [navigate, openRecord, mode]);

    const switchToEdit = useCallback(() => {
        if (panel?.kind === 'view') {
            navigate({ type: 'open', record: panel.selected.record_id, mode: 'edit' });
        }
    }, [panel, navigate]);

    const deleteMutation = useFormListDeleteMutation(pageId, sectionId);
    const [deleteTarget, setDeleteTarget] = useState<IDeleteTarget | null>(null);
    const [deleteNotice, setDeleteNotice] = useState<'conflict' | 'error' | null>(null);

    const closeDelete = useCallback(() => {
        setDeleteTarget(null);
        setDeleteNotice(null);
    }, []);

    const confirmDelete = useCallback(() => {
        if (deleteTarget === null) {
            return;
        }
        const target = deleteTarget;
        deleteMutation.mutate(
            { recordId: target.recordId, expectedVersion: target.version },
            {
                onSuccess: () => {
                    closeDelete();
                    announce(FORM_LIST_TEXT.deleted);
                    notifications.show({ message: FORM_LIST_TEXT.deleted, color: 'green' });
                    if (openRecord === target.recordId) {
                        closeRecord();
                    }
                },
                onError: (error) => {
                    setDeleteNotice(getFormStaleVersion(error) !== null ? 'conflict' : 'error');
                },
            },
        );
    }, [deleteTarget, deleteMutation, closeDelete, announce, openRecord, closeRecord]);

    const quickMutation = useFormListQuickActionMutation(pageId, sectionId);
    const [quickTarget, setQuickTarget] = useState<IQuickTarget | null>(null);

    const runQuickAction = useCallback((target: IQuickTarget) => {
        quickMutation.mutate(
            { recordId: target.row.record_id, actionId: target.action.id, expectedVersion: target.row.version },
            {
                onSuccess: () => {
                    setQuickTarget(null);
                    const message = `${target.action.label}: ${FORM_LIST_TEXT.actionDone}`;
                    announce(message);
                    notifications.show({ message, color: 'green' });
                },
                onError: (error) => {
                    setQuickTarget(null);
                    setNotice(getFormStaleVersion(error) !== null
                        ? { tone: 'conflict', message: FORM_LIST_TEXT.conflictDeleteBody }
                        : { tone: 'error', message: FORM_LIST_TEXT.loadFailed });
                },
            },
        );
    }, [quickMutation, announce]);

    const startQuickAction = useCallback((action: IFormListQuickActionInfo, row: IFormListRow, label: string) => {
        setNotice(null);
        const target = { action, row, label };
        if (action.confirm !== null && action.confirm !== '') {
            setQuickTarget(target);
        } else {
            runQuickAction(target);
        }
    }, [runQuickAction]);

    // -- focus: page presentation moves between the list and the record --------------
    const rootRef = useRef<HTMLDivElement | null>(null);
    const previousPanelKind = useRef<string | null>(null);
    useEffect(() => {
        if (presentation === 'page' && previousPanelKind.current !== null && panelKind === null) {
            rootRef.current?.focus();
        }
        previousPanelKind.current = panelKind;
    }, [panelKind, presentation]);

    // -- drawing ------------------------------------------------------------------------
    if (listKey === '') {
        return <Alert color="yellow" className={cssClass}>{FORM_LIST_TEXT.notConfigured}</Alert>;
    }

    const rootProps = { ref: rootRef, tabIndex: -1, className: `${styles.root} ${cssClass ?? ''}`.trim(), 'data-form-list': listKey, 'data-form-list-style': style.style_name, style: { outline: 'none' } } as const;

    if (state === null) {
        if (list.failure !== null) {
            return (
                <div {...rootProps}>
                    {heading && <Title order={3} mb="sm">{heading}</Title>}
                    <FormListErrorState
                        failure={list.failure}
                        onRetry={list.retry}
                        onShowAll={() => url.clear()}
                    />
                </div>
            );
        }
        return (
            <div {...rootProps} aria-busy="true">
                {heading && <Title order={3} mb="sm">{heading}</Title>}
                <VisuallyHidden role="status">{FORM_LIST_TEXT.loading}</VisuallyHidden>
                <Stack gap="xs" data-testid="form-list-loading">
                    <Skeleton height={36} />
                    <Skeleton height={28} />
                    <Skeleton height={28} />
                    <Skeleton height={28} />
                </Stack>
            </div>
        );
    }

    const labels = state.list.labels;
    const addLabel = labels.add ?? FORM_LIST_TEXT.add;
    const searchLabel = labels.search ?? FORM_LIST_TEXT.search;
    const emptyLabel = labels.empty ?? FORM_LIST_TEXT.empty;
    const deleteQuestion = labels.confirm_delete ?? FORM_LIST_TEXT.confirmDelete;
    const canCreate = isEntryList && state.capabilities.create;
    const narrowed = urlState.q !== null || Object.keys(urlState.filters).length > 0;
    const pagination = state.pagination;
    const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.page_size + 1;
    const to = from === 0 ? 0 : from + state.rows.length - 1;
    const resultsText = pagination.total === 0
        ? 'No entries.'
        : `${pagination.total} ${pagination.total === 1 ? 'entry' : 'entries'}, page ${pagination.page} of ${pagination.total_pages}.`;
    const hasActions = state.rows.some((row) => rowHasActions(row, isEntryList ? 'entry-form-list' : 'data-view'));
    const busy = list.isFetching;

    const renderActions = (row: IFormListRow, label: string) => (
        <FormListRowActions
            row={row}
            label={label}
            kind={isEntryList ? 'entry-form-list' : 'data-view'}
            historyOffered={historyOffered}
            quickActions={state.capabilities.quick_actions}
            onOpen={(openMode, openTab) => openRecordFromRow(row, openMode, openTab)}
            onDelete={() => {
                setDeleteNotice(null);
                setDeleteTarget({ recordId: row.record_id, version: row.version, label });
            }}
            onQuickAction={(action) => startQuickAction(action, row, label)}
        />
    );

    const recordTitle = (() => {
        if (panel === null) {
            return '';
        }
        switch (panel.kind) {
            case 'create':
                return addLabel;
            case 'edit':
                return `${FORM_LIST_TEXT.editTitle}: ${rowLabel(panel.selected, state.columns)}`;
            case 'view':
                return rowLabel(panel.selected, state.columns);
            default:
                return FORM_LIST_TEXT.entry;
        }
    })();

    const recordBody = panel === null ? null : (
        <FormListRecord
            pageId={pageId}
            sectionId={sectionId}
            state={state}
            panel={panel}
            formChild={formChild}
            formContext={formContext}
            formKey={`${panel.kind}-${panel.kind === 'edit' ? panel.selected.record_id : 'new'}-${formEpoch}`}
            conflict={conflict}
            onConflictKeep={keepDraft}
            onConflictReload={reloadLatest}
            tab={tab}
            onTab={switchRecordTab}
            historyOffered={historyOffered}
            onEdit={switchToEdit}
            onDelete={() => {
                if (panel.kind === 'view') {
                    setDeleteNotice(null);
                    setDeleteTarget({
                        recordId: panel.selected.record_id,
                        version: panel.selected.version,
                        label: rowLabel(panel.selected, state.columns),
                    });
                }
            }}
            onRestored={() => {
                announce('Version restored.');
                void invalidateFormList(queryClient);
            }}
            onBack={presentation === 'page' ? requestClose : null}
        />
    );

    const pageMode = presentation === 'page' && panel !== null;

    return (
        <div {...rootProps} aria-busy={busy}>
            {heading && <Title order={3} mb="sm">{heading}</Title>}

            <VisuallyHidden role="status" aria-live="polite" data-testid="form-list-status">
                {announcement !== '' ? announcement : resultsText}
            </VisuallyHidden>

            {pageMode ? (
                <Paper withBorder p="md" component="section" aria-label={recordTitle} data-testid="form-list-record-page">
                    <Title order={4} mb="md">{recordTitle}</Title>
                    {recordBody}
                </Paper>
            ) : (
                <Stack gap="md">
                    {notice !== null && (
                        <Alert
                            color={notice.tone === 'conflict' ? 'orange' : 'red'}
                            role="alert"
                            withCloseButton
                            onClose={() => setNotice(null)}
                        >
                            <Group justify="space-between" wrap="wrap" gap="sm">
                                <span>{notice.message}</span>
                                {notice.tone === 'conflict' && (
                                    <Button size="compact-sm" variant="light" onClick={() => { setNotice(null); void invalidateFormList(queryClient); }}>
                                        {FORM_LIST_TEXT.conflictReloadList}
                                    </Button>
                                )}
                            </Group>
                        </Alert>
                    )}

                    {list.refreshFailure !== null && (
                        <Alert color="yellow" role="alert">
                            <Group justify="space-between" wrap="wrap" gap="sm">
                                <span>{FORM_LIST_TEXT.refreshFailed}</span>
                                <Button size="compact-sm" variant="light" onClick={list.retry}>{FORM_LIST_TEXT.retry}</Button>
                            </Group>
                        </Alert>
                    )}

                    <FormListToolbar
                        state={state}
                        urlState={urlState}
                        onChange={navigate}
                        addLabel={addLabel}
                        searchLabel={searchLabel}
                        canCreate={canCreate}
                        onAdd={() => navigate({ type: 'create' })}
                    />

                    {state.rows.length === 0 ? (
                        <Stack gap="xs" align="flex-start" data-testid="form-list-empty">
                            <Text c="dimmed">{narrowed ? FORM_LIST_TEXT.emptyFiltered : emptyLabel}</Text>
                            {narrowed && (
                                <Button variant="light" size="compact-sm" onClick={() => navigate({ type: 'reset' })}>
                                    {FORM_LIST_TEXT.resetFilters}
                                </Button>
                            )}
                        </Stack>
                    ) : state.list.layout === 'custom' && state.list.has_template ? (
                        <FormListCustom state={state} busy={busy} />
                    ) : state.list.layout === 'cards' || state.list.layout === 'custom' ? (
                        // A `custom` layout whose author placed no sections falls back to cards.
                        <FormListCards state={state} renderActions={renderActions} hasActions={hasActions} busy={busy} />
                    ) : (
                        <FormListTable
                            state={state}
                            renderActions={renderActions}
                            hasActions={hasActions}
                            busy={busy}
                            caption={heading ?? `${FORM_LIST_TEXT.entry}s`}
                            onSort={(field) => navigate({ type: 'sort', sort: nextSortOnHeaderClick(state.state.sort, field) })}
                        />
                    )}

                    {pagination.total_pages > 1 && (
                        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                            <Text size="sm" c="dimmed">{from}-{to} of {pagination.total}</Text>
                            <Pagination
                                total={pagination.total_pages}
                                value={pagination.page}
                                onChange={(page) => navigate({ type: 'page', page })}
                                getItemProps={(page) => ({ 'aria-label': `Page ${page}` })}
                                getControlProps={(control) => ({
                                    'aria-label': ({ first: 'First page', previous: FORM_LIST_TEXT.previous, next: FORM_LIST_TEXT.next, last: 'Last page' } as const)[control],
                                })}
                                size={compact ? 'sm' : 'md'}
                            />
                        </Group>
                    )}
                </Stack>
            )}

            {presentation === 'modal' && (
                <Modal
                    opened={panel !== null}
                    onClose={requestClose}
                    title={recordTitle}
                    size="lg"
                    centered={!compact}
                    fullScreen={Boolean(compact)}
                    trapFocus
                    returnFocus
                    closeOnClickOutside={false}
                    // The app theme turns Escape off for modals by default; closing goes through requestClose,
                    // which asks first when there is unsaved input, so Escape is safe here and expected by keyboard
                    // users. While a question (discard, delete, quick action) is open, Escape belongs to it.
                    closeOnEscape={discard === null && deleteTarget === null && quickTarget === null}
                >
                    {recordBody}
                </Modal>
            )}

            <FormListConfirmDialog
                opened={deleteTarget !== null}
                title={FORM_LIST_TEXT.delete}
                confirmLabel={FORM_LIST_TEXT.delete}
                cancelLabel={deleteNotice === 'conflict' ? FORM_LIST_TEXT.close : FORM_LIST_TEXT.cancel}
                busy={deleteMutation.isPending}
                hideConfirm={deleteNotice === 'conflict'}
                onConfirm={confirmDelete}
                onCancel={() => {
                    const stale = deleteNotice === 'conflict';
                    closeDelete();
                    if (stale) {
                        void invalidateFormList(queryClient);
                    }
                }}
                notice={
                    deleteNotice === null ? null : (
                        <Alert color={deleteNotice === 'conflict' ? 'orange' : 'red'} role="alert">
                            {deleteNotice === 'conflict' ? FORM_LIST_TEXT.conflictDeleteBody : FORM_LIST_TEXT.loadFailed}
                        </Alert>
                    )
                }
            >
                <Text>{deleteTarget !== null ? `${deleteTarget.label}: ${deleteQuestion}` : deleteQuestion}</Text>
            </FormListConfirmDialog>

            <FormListConfirmDialog
                opened={quickTarget !== null}
                title={quickTarget?.action.label ?? ''}
                confirmLabel={quickTarget?.action.label ?? ''}
                cancelLabel={FORM_LIST_TEXT.cancel}
                confirmColor="blue"
                busy={quickMutation.isPending}
                onConfirm={() => quickTarget !== null && runQuickAction(quickTarget)}
                onCancel={() => setQuickTarget(null)}
            >
                <Text>{quickTarget !== null ? `${quickTarget.label}: ${quickTarget.action.confirm ?? ''}` : ''}</Text>
            </FormListConfirmDialog>

            <FormListConfirmDialog
                opened={discard !== null}
                title={FORM_LIST_TEXT.discardTitle}
                confirmLabel={FORM_LIST_TEXT.discardConfirm}
                cancelLabel={FORM_LIST_TEXT.keepEditing}
                onConfirm={() => {
                    const pending = discard;
                    dirtyCheckRef.current = null;
                    setDiscard(null);
                    pending?.proceed();
                }}
                onCancel={() => setDiscard(null)}
            >
                <Text>{FORM_LIST_TEXT.discardBody}</Text>
            </FormListConfirmDialog>
        </div>
    );
};

export default FormListStyle;
