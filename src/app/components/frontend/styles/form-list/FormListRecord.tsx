/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import { Alert, Button, Group, Loader, Stack, Tabs, Text } from '@mantine/core';
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';
import type { IFormStaleVersionData, IFormListState } from '../../../../../shared';
import { useFormListCompare } from '../../../../../hooks/useFormList';
import type { TStyle } from '../../../../../types/common/styles.types';
import BasicStyle from '../BasicStyle';
import { FormListChanges } from './FormListChanges';
import { FormListFormProvider, type IFormListFormContext } from './FormListFormContext';
import { FormListHistory } from './FormListHistory';
import { FormListRecordView } from './FormListRecordView';
import type { TFormListOpenTab } from './FormListRowActions';
import { FORM_LIST_TEXT } from './form-list.constants';
import type { TFormListPanel } from './form-list.types';
import styles from './FormList.module.css';

interface IFormListRecordProps {
    pageId: number;
    sectionId: number;
    state: IFormListState;
    panel: TFormListPanel;
    /** The list synthesized as a form (or null when the list has no form). */
    formChild: TStyle | null;
    /** What the inline form needs (record, prefill, version, callbacks); null outside create/edit. */
    formContext: IFormListFormContext | null;
    /** Changes when the inline form must be rebuilt from scratch (another record, "load the latest version"). */
    formKey: string;
    conflict: IFormStaleVersionData | null;
    onConflictKeep: () => void;
    onConflictReload: () => void;
    tab: TFormListOpenTab;
    onTab: (tab: TFormListOpenTab) => void;
    historyOffered: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onRestored: () => void;
    /** Page presentation only: the way back to the list. */
    onBack: (() => void) | null;
}

interface IConflictProps {
    conflict: IFormStaleVersionData;
    pageId: number;
    sectionId: number;
    onKeep: () => void;
    onReload: () => void;
}

/**
 * A save the server refused because someone else changed the record first.
 * Nothing was written and what the person typed is still in the form below.
 * They can look at what changed, keep their input and save over the newer
 * version on purpose, or load the latest version (discarding their input).
 */
function Conflict({ conflict, pageId, sectionId, onKeep, onReload }: IConflictProps) {
    const [review, setReview] = useState(false);
    const comparison = useFormListCompare(
        { pageId, sectionId, recordId: conflict.record_id },
        review ? conflict.expected_version : null,
        review ? conflict.current_version : null,
    );

    return (
        <Alert
            color="orange"
            icon={<IconAlertTriangle size={18} aria-hidden="true" />}
            title={FORM_LIST_TEXT.conflictTitle}
            role="alert"
            data-testid="form-list-conflict"
        >
            <Stack gap="sm">
                <Text size="sm">{FORM_LIST_TEXT.conflictBody}</Text>
                <Text size="xs" c="dimmed">
                    You started from version {conflict.expected_version}; the entry is now at version {conflict.current_version}.
                </Text>
                <Group gap="xs" wrap="wrap">
                    <Button size="compact-sm" variant="light" onClick={() => setReview((value) => !value)} aria-expanded={review}>
                        {FORM_LIST_TEXT.conflictReview}
                    </Button>
                    <Button size="compact-sm" variant="light" color="orange" onClick={onKeep}>
                        {FORM_LIST_TEXT.conflictKeep}
                    </Button>
                    <Button size="compact-sm" variant="default" onClick={onReload}>
                        {FORM_LIST_TEXT.conflictReload}
                    </Button>
                </Group>
                {review && (
                    <div>
                        {comparison.isLoading && <Loader size="sm" aria-label={FORM_LIST_TEXT.loading} />}
                        {comparison.error ? <Text size="sm" c="red">{FORM_LIST_TEXT.historyDenied}</Text> : null}
                        {comparison.data && <FormListChanges changes={comparison.data.changes} />}
                    </div>
                )}
            </Stack>
        </Alert>
    );
}

/**
 * The area of a list that shows one record or the create form. The caller puts
 * it in a dialog or on the page; this component only decides its content.
 */
export function FormListRecord({
    pageId,
    sectionId,
    state,
    panel,
    formChild,
    formContext,
    formKey,
    conflict,
    onConflictKeep,
    onConflictReload,
    tab,
    onTab,
    historyOffered,
    onEdit,
    onDelete,
    onRestored,
    onBack,
}: IFormListRecordProps) {
    const back = onBack !== null ? (
        <div>
            <Button variant="subtle" size="compact-sm" leftSection={<IconArrowLeft size={14} aria-hidden="true" />} onClick={onBack}>
                {FORM_LIST_TEXT.backToList}
            </Button>
        </div>
    ) : null;

    if (panel.kind === 'loading') {
        return (
            <Stack gap="sm" className={styles.record}>
                {back}
                <Loader size="sm" aria-label={FORM_LIST_TEXT.loading} />
            </Stack>
        );
    }

    if (panel.kind === 'unavailable') {
        return (
            <Stack gap="sm" className={styles.record}>
                {back}
                <Alert color="red" role="alert">{FORM_LIST_TEXT.notFound}</Alert>
            </Stack>
        );
    }

    if (panel.kind === 'create' || panel.kind === 'edit') {
        const cannotEdit = panel.kind === 'edit' && (!panel.selected.can_update || panel.selected.form_values === null);
        return (
            <Stack gap="md" className={styles.record} data-testid="form-list-record-form">
                {back}
                {cannotEdit && <Alert color="yellow" role="alert">{FORM_LIST_TEXT.cannotEdit}</Alert>}
                {!cannotEdit && conflict !== null && (
                    <Conflict
                        conflict={conflict}
                        pageId={pageId}
                        sectionId={sectionId}
                        onKeep={onConflictKeep}
                        onReload={onConflictReload}
                    />
                )}
                {!cannotEdit && formChild === null && <Alert color="red" role="alert">{FORM_LIST_TEXT.noForm}</Alert>}
                {!cannotEdit && formChild !== null && formContext !== null && (
                    <FormListFormProvider key={formKey} value={formContext}>
                        <BasicStyle style={formChild} />
                    </FormListFormProvider>
                )}
            </Stack>
        );
    }

    const { selected } = panel;
    const showHistory = historyOffered && selected.can_view_history;
    const details = (
        <Stack gap="md">
            <FormListRecordView columns={state.columns} selected={selected} />
            <Group gap="xs">
                {selected.can_update && formChild !== null && (
                    <Button size="compact-sm" onClick={onEdit}>{FORM_LIST_TEXT.edit}</Button>
                )}
                {selected.can_delete && (
                    <Button size="compact-sm" color="red" variant="light" onClick={onDelete}>{FORM_LIST_TEXT.delete}</Button>
                )}
            </Group>
        </Stack>
    );

    return (
        <Stack gap="md" className={styles.record} data-testid="form-list-record-view-panel">
            {back}
            {showHistory ? (
                <Tabs value={tab} onChange={(value) => onTab(value === 'history' ? 'history' : 'details')}>
                    <Tabs.List>
                        <Tabs.Tab value="details">{FORM_LIST_TEXT.details}</Tabs.Tab>
                        <Tabs.Tab value="history">{FORM_LIST_TEXT.history}</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="details" pt="md">{details}</Tabs.Panel>
                    <Tabs.Panel value="history" pt="md">
                        <FormListHistory
                            pageId={pageId}
                            sectionId={sectionId}
                            recordId={selected.record_id}
                            canRestore={selected.can_update}
                            onRestored={onRestored}
                        />
                    </Tabs.Panel>
                </Tabs>
            ) : details}
        </Stack>
    );
}
