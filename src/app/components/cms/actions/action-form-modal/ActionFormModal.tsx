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
  const [trigger, setTrigger] = useState<string>('');
  const [dataTableId, setDataTableId] = useState<string>('');
  const [configObj, setConfigObj] = useState<any>({ blocks: [] });
  const [actionTranslations, setActionTranslations] = useState<{ [key: string]: { [languageId: number]: string } }>({});
  const lastBuilderJsonRef = useRef<string>(JSON.stringify({ blocks: [] }));

  const { data: tables } = useDataTables();
  const dataTablesOptions = useMemo(
    () => (tables?.dataTables || []).map((t) => ({ value: String(t.id), label: t.displayName || t.name })),
    [tables]
  );

  useEffect(() => {
    if (mode === 'edit' && details && opened) {
      setName(details.name || '');
      const triggerId = (details.action_trigger_type?.id ?? details.id_actionTriggerTypes) as any;
      setTrigger(triggerId ? String(triggerId) : '');
      try { setConfigObj(details.config || { blocks: [] }); lastBuilderJsonRef.current = JSON.stringify(details.config || { blocks: [] }); } catch { setConfigObj({ blocks: [] }); lastBuilderJsonRef.current = JSON.stringify({ blocks: [] }); }
      const dtId = (details.data_table?.id ?? details.id_dataTables) as any;
      setDataTableId(dtId ? String(dtId) : '');
    }
    if (mode === 'create' && opened) {
      setName(''); setTrigger(''); setDataTableId(''); setConfigObj({ blocks: [] }); lastBuilderJsonRef.current = JSON.stringify({ blocks: [] });
    }
  }, [mode, details, opened]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
            <Select label="Trigger type" data={triggerData} value={trigger} onChange={(v) => setTrigger(v || '')} placeholder="Select trigger" searchable />
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


