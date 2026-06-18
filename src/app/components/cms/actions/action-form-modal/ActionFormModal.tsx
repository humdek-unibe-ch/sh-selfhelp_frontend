/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, List, LoadingOverlay, Select, Stack, TextInput } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import classes from './ActionFormModal.module.css';
import { useCreateAction, useActionDetails, useUpdateAction } from '../../../../../hooks/useActions';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import type { ICreateActionRequest, IUpdateActionRequest, IActionTranslationRequest, IActionConfig } from '../../../../../types/requests/admin/actions.types';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { ACTION_TRIGGER_TYPES } from '../../../../../constants/lookups.constants';
import dynamic from 'next/dynamic';
import { useDataTables } from '../../../../../hooks/useData';
import { ActionConfigBuilder } from '../action-config-builder/ActionConfigBuilder';

// Default action config used for the initial state, the dedupe ref seed, and
// the create-mode reset (previously duplicated inline in three places).
const DEFAULT_ACTION_CONFIG = {
  blocks: [{
    block_name: 'Block',
    jobs: [{
      job_name: 'Job',
      job_type: 'notification',
      schedule_time: {
        job_schedule_types: 'immediately'
      },
      notification: {
        notification_types: 'email',
        recipient: '{{recipient.email}}',
        subject: 'block_0.job_0.notification.subject',
        body: 'block_0.job_0.notification.body'
      }
    }]
  }]
};

// Load Monaco JSON editor dynamically
const _MonacoFieldEditor = dynamic(() => import('../../shared/monaco-field-editor/MonacoFieldEditor').then(m => m.MonacoFieldEditor), { ssr: false });

interface IActionFormModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  actionId?: number;
}

export function ActionFormModal({ opened, onClose, mode, actionId }: IActionFormModalProps) {
  const { data: details, isLoading: isDetailsLoading } = useActionDetails(actionId || 0);
  const createMutation = useCreateAction();
  const updateMutation = useUpdateAction(actionId || 0);

  const triggerLookups = useLookupsByType(ACTION_TRIGGER_TYPES);
  const triggerData = useMemo(() => triggerLookups.map(l => ({ value: String(l.id), label: l.lookupValue })), [triggerLookups]);

  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<string>('finished'); // Default to "finished"
  const [dataTableId, setDataTableId] = useState<string>('');
  const [configObj, setConfigObj] = useState<IActionConfig>(DEFAULT_ACTION_CONFIG);
  const [actionTranslations, setActionTranslations] = useState<{ [key: string]: { [languageId: number]: string } }>({});
  const lastBuilderJsonRef = useRef<string>(JSON.stringify(DEFAULT_ACTION_CONFIG));

  const { data: tables } = useDataTables();
  const dataTablesOptions = useMemo(
    () => (tables?.dataTables || []).map((t) => ({ value: String(t.id), label: t.displayName || t.name })),
    [tables]
  );

  // Memoized callback functions to prevent re-renders
  const handleConfigChange = useCallback((cfg: IActionConfig) => {
    const next = JSON.stringify(cfg);
    if (next !== lastBuilderJsonRef.current) {
      lastBuilderJsonRef.current = next;
      setConfigObj(cfg);
    }
  }, []);

  const handleTranslationsChange = useCallback((translations: { [key: string]: { [languageId: number]: string } }) => {
    setActionTranslations(translations);
  }, []);

  // Keep the dedupe ref (a non-render value) in sync with the initialized
  // config; ref writes must stay out of render, so this stays an effect.
  useEffect(() => {
    if (mode === 'edit' && details && opened) {
      try {
        lastBuilderJsonRef.current = JSON.stringify(details.config || { blocks: [] });
      } catch {
        lastBuilderJsonRef.current = JSON.stringify({ blocks: [] });
      }
    } else if (mode === 'create' && opened) {
      lastBuilderJsonRef.current = JSON.stringify(DEFAULT_ACTION_CONFIG);
    }
  }, [mode, details, opened]);

  // Initialize the form fields when the modal opens (and, for edit, once the
  // action details have loaded). The one-time sync is keyed on a SIGNATURE that
  // captures open/mode/action + whether details are ready — NOT on the
  // `details` object reference. This matters:
  //   * On a remount where the details query is ALREADY cached (reopening an
  //     action), the old `prevDetails === details` guard never fired, so the
  //     edit form silently stayed empty — the reported "reopen in edit does not
  //     populate" bug.
  //   * Keying on `details ? 'ready' : 'loading'` runs the populate exactly once
  //     on the loading→ready transition; a later background refetch keeps the
  //     same signature and so will NOT clobber the user's in-progress edits.
  const syncSignature = `${mode}|${opened ? 'open' : 'closed'}|${actionId ?? ''}|${details ? 'ready' : 'loading'}`;
  const [lastSyncSignature, setLastSyncSignature] = useState<string | null>(null);
  if (lastSyncSignature !== syncSignature) {
    setLastSyncSignature(syncSignature);
    if (opened && mode === 'edit' && details) {
      setName(details.name || '');
      const triggerId = details.action_trigger_type?.id ?? details.id_actionTriggerTypes;
      setTrigger(triggerId ? String(triggerId) : 'finished');
      setConfigObj(details.config || { blocks: [] });
      const dtId = details.data_table?.id ?? details.id_dataTables;
      setDataTableId(dtId ? String(dtId) : '');
    } else if (opened && mode === 'create') {
      setName('');
      setTrigger('finished');
      setDataTableId('');
      setConfigObj(DEFAULT_ACTION_CONFIG);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Single source of truth for validation: build the list of unmet
  // requirements. The Save button is disabled while it is non-empty, and the
  // same list is shown to the user so a disabled Save is never a mystery. The
  // backend mandates name, trigger, data table and a valid job config (see
  // AdminActionService::createAction → "Field … is required").
  const missingRequirements = useMemo(() => {
    const missing: string[] = [];
    if (!name.trim()) missing.push('Action name');
    if (!trigger) missing.push('Trigger type');
    if (!dataTableId) {
      missing.push(
        dataTablesOptions.length === 0
          ? 'Data table (none exist yet — create a form/data table first)'
          : 'Data table'
      );
    }

    // True when a translation key has non-empty content in at least one
    // language. Subject/body are stored as translations keyed by the config's
    // `notification.subject` / `notification.body` value, NOT inline on the job.
    const hasTranslationContent = (key: string | undefined): boolean => {
      if (!key) return false;
      const perLanguage = actionTranslations[key];
      return !!perLanguage && Object.values(perLanguage).some((v) => typeof v === 'string' && v.trim().length > 0);
    };

    const NOTIFICATION_JOB_TYPES = ['notification', 'notification_with_reminder', 'notification_with_reminder_for_diary'];

    // First config problem only, mirroring the original short-circuit so the
    // message stays focused instead of repeating per block/job.
    const configError = (() => {
      const blocks = configObj?.blocks || [];
      if (blocks.length === 0) return 'At least one block';
      for (const [bIndex, block] of blocks.entries()) {
        if (!block.jobs || block.jobs.length === 0) return 'At least one job in every block';
        for (const [jIndex, job] of block.jobs.entries()) {
          if (!job.job_name?.trim()) return 'Job name';
          if (!job.job_type) return 'Job type';
          if (!job.schedule_time?.job_schedule_types) return 'Schedule type';
          if (NOTIFICATION_JOB_TYPES.includes(job.job_type)) {
            if (!job.notification?.recipient?.trim()) return 'Notification recipient';
            // Subject and body are mandatory for every notification job. They
            // live in the translations map under the config's key (falling back
            // to the conventional key when the config has not stored it yet).
            const subjectKey = job.notification?.subject || `block_${bIndex}.job_${jIndex}.notification.subject`;
            const bodyKey = job.notification?.body || `block_${bIndex}.job_${jIndex}.notification.body`;
            if (!hasTranslationContent(subjectKey)) return 'Notification subject';
            if (!hasTranslationContent(bodyKey)) return 'Notification body';
          }
        }
      }
      return null;
    })();
    if (configError) missing.push(configError);

    return missing;
  }, [name, trigger, dataTableId, dataTablesOptions.length, configObj, actionTranslations]);

  const isFormValid = missingRequirements.length === 0;

  const handleSave = async () => {
    const parsed: IActionConfig | null = configObj || null;

    const id_data_tables = Number(dataTableId) || 0;

    // Convert translations object to array format expected by backend
    const translations: IActionTranslationRequest[] = Object.keys(actionTranslations).length > 0
      ? Object.entries(actionTranslations).flatMap(([key, langTranslations]) =>
          Object.entries(langTranslations).map(([langId, content]) => ({
            translation_key: key,
            id_languages: Number(langId),
            content
          }))
        )
      : [];

    if (mode === 'create') {
      const payload: ICreateActionRequest = {
        name,
        id_action_trigger_types: Number(trigger) || trigger,
        id_data_tables: id_data_tables,
        config: parsed || undefined,
        translations: translations.length > 0 ? translations : undefined
      };
      await createMutation.mutateAsync(payload);
      onClose();
    } else if (mode === 'edit' && actionId) {
      const payload: IUpdateActionRequest = {
        name,
        id_action_trigger_types: Number(trigger) || trigger,
        id_data_tables: id_data_tables,
        config: parsed || undefined,
        translations: translations.length > 0 ? translations : undefined
      };
      await updateMutation.mutateAsync(payload);
      onClose();
    }
  };

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? 'Create Action' : 'Edit Action'}
      size="95%"
      scrollAreaHeight="70vh"
      onSave={handleSave}
      onCancel={onClose}
      isLoading={isSaving}
      disabled={!isFormValid}
      saveLabel="Save"
      cancelLabel="Cancel"
    >
      <LoadingOverlay visible={isSaving || (mode === 'edit' && isDetailsLoading)} />
      <Stack gap="md">
        {!isFormValid && !isSaving && (
          <Alert
            color="yellow"
            variant="light"
            icon={<IconAlertTriangle size={16} />}
            title="Complete these required fields to enable Save"
          >
            <List size="sm" spacing={2}>
              {missingRequirements.map((item) => (
                <List.Item key={item}>{item}</List.Item>
              ))}
            </List>
          </Alert>
        )}
        <div className={classes.formGrid}>
          <div className={classes.gridCol4}>
            <TextInput label="Action name" placeholder="Enter action name" value={name} onChange={(e) => setName(e.currentTarget.value)} required size="sm" />
          </div>
          <div className={classes.gridCol4}>
            <Select label="Trigger type" data={triggerData} value={trigger} onChange={(v) => setTrigger(v || 'finished')} placeholder="Select trigger" searchable required size="sm" />
          </div>
          <div className={classes.gridCol4}>
            <Select label="Data table" data={dataTablesOptions} value={dataTableId} onChange={(v) => setDataTableId(v || '')} placeholder="Select data table" searchable required size="sm" />
          </div>
          <div className={classes.gridCol12}>
            <ActionConfigBuilder
              actionId={mode === 'edit' ? actionId : undefined}
              value={configObj}
              onChange={handleConfigChange}
              onTranslationsChange={handleTranslationsChange}
            />
          </div>
        </div>
      </Stack>
    </ModalWrapper>
  );
}


