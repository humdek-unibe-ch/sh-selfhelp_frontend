"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Group, LoadingOverlay, ScrollArea, Select, Stack, Text, TextInput, NumberInput } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import classes from './ActionFormModal.module.css';
import { useCreateAction, useActionDetails, useUpdateAction } from '../../../../../hooks/useActions';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import type { ICreateActionRequest, IUpdateActionRequest, IActionTranslationRequest } from '../../../../../types/requests/admin/actions.types';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { ACTION_TRIGGER_TYPES } from '../../../../../constants/lookups.constants';
import dynamic from 'next/dynamic';
import { useDataTables } from '../../../../../hooks/useData';
import { ActionConfigBuilder } from '../action-config-builder/ActionConfigBuilder';

// Load Monaco JSON editor dynamically
const MonacoFieldEditor = dynamic(() => import('../../shared/monaco-field-editor/MonacoFieldEditor').then(m => m.MonacoFieldEditor), { ssr: false });

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
  const [configObj, setConfigObj] = useState<any>({
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
          recipient: '@user'
        }
      }]
    }]
  });
  const [actionTranslations, setActionTranslations] = useState<{ [key: string]: { [languageId: number]: string } }>({});
  const lastBuilderJsonRef = useRef<string>(JSON.stringify({
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
          recipient: '@user'
        }
      }]
    }]
  }));

  const { data: tables } = useDataTables();
  const dataTablesOptions = useMemo(
    () => (tables?.dataTables || []).map((t) => ({ value: String(t.id), label: t.displayName || t.name })),
    [tables]
  );

  useEffect(() => {
    if (mode === 'edit' && details && opened) {
      setName(details.name || '');
      const triggerId = (details.action_trigger_type?.id ?? details.id_actionTriggerTypes) as any;
      setTrigger(triggerId ? String(triggerId) : 'finished');
      try { setConfigObj(details.config || { blocks: [] }); lastBuilderJsonRef.current = JSON.stringify(details.config || { blocks: [] }); } catch { setConfigObj({ blocks: [] }); lastBuilderJsonRef.current = JSON.stringify({ blocks: [] }); }
      const dtId = (details.data_table?.id ?? details.id_dataTables) as any;
      setDataTableId(dtId ? String(dtId) : '');
    }
    if (mode === 'create' && opened) {
      setName(''); setTrigger('finished'); setDataTableId('');
      const defaultConfig = {
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
              recipient: '@user'
            }
          }]
        }]
      };
      setConfigObj(defaultConfig);
      lastBuilderJsonRef.current = JSON.stringify(defaultConfig);
    }
  }, [mode, details, opened]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Form validation
  const isFormValid = useMemo(() => {
    // Basic required fields
    if (!name.trim()) return false;
    if (!trigger) return false;
    if (!dataTableId) return false;

    // Check if action config has required fields
    const blocks = configObj?.blocks || [];
    if (blocks.length === 0) return false;

    // Check each block has jobs
    for (const block of blocks) {
      if (!block.jobs || block.jobs.length === 0) return false;

      // Check each job has required fields
      for (const job of block.jobs) {
        // Job name is required
        if (!job.job_name?.trim()) return false;

        // Job type is required
        if (!job.job_type) return false;

        // Schedule time with schedule type is required
        if (!job.schedule_time?.job_schedule_types) return false;

        // For notification jobs, check notification fields
        if (['notification', 'notification_with_reminder', 'notification_with_reminder_for_diary'].includes(job.job_type)) {
          const notification = job.notification || {};
          if (!notification.recipient?.trim()) return false;
          // Note: Subject and body validation is handled by the GroupedTranslationInput component
          // We assume that if the user has progressed this far, the translations are valid
        }
      }
    }

    return true;
  }, [name, trigger, dataTableId, configObj]);

  const handleSave = async () => {
    let parsed: any = configObj || null;

    const id_dataTables = Number(dataTableId) || 0;

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
        id_actionTriggerTypes: Number(trigger) || trigger,
        id_dataTables,
        config: parsed || undefined,
        translations: translations.length > 0 ? translations : undefined
      };
      await createMutation.mutateAsync(payload);
      onClose();
    } else if (mode === 'edit' && actionId) {
      const payload: IUpdateActionRequest = {
        name,
        id_actionTriggerTypes: Number(trigger) || trigger,
        id_dataTables,
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
      size="xl"
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
        <div className={classes.formGrid}>
          <div className={classes.gridCol6}>
            <TextInput label="Action name" placeholder="Enter action name" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
          </div>
          <div className={classes.gridCol6}>
            <Select label="Trigger type" data={triggerData} value={trigger} onChange={(v) => setTrigger(v || 'finished')} placeholder="Select trigger" searchable required />
          </div>
          <div className={classes.gridCol6}>
            <Select label="Data table" data={dataTablesOptions} value={dataTableId} onChange={(v) => setDataTableId(v || '')} placeholder="Select data table" searchable required />
          </div>
          <div className={classes.gridCol12}>
            <Alert variant="light" icon={<IconInfoCircle size={16} />}>Use the visual builder to configure blocks and jobs, or switch to JSON tab inside the builder.</Alert>
          </div>
          <div className={classes.gridCol12}>
            <ActionConfigBuilder
              actionId={mode === 'edit' ? actionId : undefined}
              value={configObj}
              onChange={(cfg) => {
                const next = JSON.stringify(cfg);
                if (next !== lastBuilderJsonRef.current) {
                  lastBuilderJsonRef.current = next;
                  setConfigObj(cfg);
                }
              }}
              onTranslationsChange={setActionTranslations}
            />
          </div>
        </div>
      </Stack>
    </ModalWrapper>
  );
}


