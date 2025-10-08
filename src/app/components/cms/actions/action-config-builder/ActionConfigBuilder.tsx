"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Button, Card, Group, MultiSelect, NumberInput, Select, Stack, Switch, Tabs, Text, TextInput, Textarea, Badge } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { ACTION_SCHEDULE_TYPES, TIME_PERIOD, WEEKDAYS } from '../../../../../constants/lookups.constants';
import { AdminGroupApi } from '../../../../../api/admin/group.api';
import { AdminDataApi } from '../../../../../api/admin/data.api';
import { AdminAssetApi } from '../../../../../api/admin/asset.api';
import { ConditionBuilderField } from '../../shared/field-components/ConditionBuilderField';
import dynamic from 'next/dynamic';
import { DateTimePicker, TimeInput } from '@mantine/dates';
import { useActionTranslations } from '../../../../../hooks/useActionTranslations';
import { GroupedTranslationInput } from '../grouped-translation-input/GroupedTranslationInput';
import classes from './ActionConfigBuilder.module.css';

// Global rule: Use Mantine components if any styles are needed, create module CSS
// This ensures consistent styling and better maintainability

const MonacoFieldEditor = dynamic(() => import('../../shared/monaco-field-editor/MonacoFieldEditor').then(m => m.MonacoFieldEditor), { ssr: false });

interface IActionConfigBuilderProps {
  actionId?: number;
  value?: any;
  onChange: (cfg: any) => void;
  onTranslationsChange?: (translations: { [key: string]: { [languageId: number]: string } }) => void;
}

function ensureArray<T>(arr: T[] | undefined): T[] { return Array.isArray(arr) ? arr : []; }
function toOrdinal(n: number): string {
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
const repeatEveryOptions = Array.from({ length: 30 }, (_, i) => {
  const value = String(i + 1);
  const label = i === 0 ? 'Every' : `Every ${toOrdinal(i + 1)}`;
  return { value, label };
});
const ordinal20Options = Array.from({ length: 20 }, (_, i) => ({ value: String(i + 1), label: toOrdinal(i + 1) }));
const daysOfMonthOptions = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

export function ActionConfigBuilder({ actionId, value, onChange, onTranslationsChange }: IActionConfigBuilderProps) {
  const [config, setConfig] = useState<any>(value || { blocks: [] });
  const lastPropJsonRef = useRef<string>(JSON.stringify(value || { blocks: [] }));
  const lastEmittedJsonRef = useRef<string>(JSON.stringify(value || { blocks: [] }));

  // Translation-related state
  const [localTranslations, setLocalTranslations] = useState<{ [key: string]: { [languageId: number]: string } }>({});

  // Load translations when editing an existing action
  const { data: actionTranslations } = useActionTranslations(actionId || 0);

  // Transform fetched translations to local format
  useEffect(() => {
    if (actionTranslations && actionTranslations.length > 0) {
      const transformed: { [key: string]: { [languageId: number]: string } } = {};

      actionTranslations.forEach((translation) => {
        if (!transformed[translation.translation_key]) {
          transformed[translation.translation_key] = {};
        }
        // Use translation.language.id instead of translation.id_languages
        transformed[translation.translation_key][translation.language.id] = translation.content;
      });

      setLocalTranslations(transformed);
    }
  }, [actionTranslations]);

  // Notify parent when local translations change
  useEffect(() => {
    if (onTranslationsChange) {
      onTranslationsChange(localTranslations);
    }
  }, [localTranslations, onTranslationsChange]);

  // Sync from parent value (edit or external JSON changes) with loop prevention
  useEffect(() => {
    if (!value) return;
    const incoming = JSON.stringify(value);
    const current = JSON.stringify(config);
    // Only accept prop when it differs from current AND is not just our last emitted
    if (incoming !== current && incoming !== lastEmittedJsonRef.current) {
      lastPropJsonRef.current = incoming;
      setConfig(value);
    }
  }, [value]);
  const scheduleTypes = useLookupsByType(ACTION_SCHEDULE_TYPES);
  const timePeriod = useLookupsByType(TIME_PERIOD);
  const weekdays = useLookupsByType(WEEKDAYS);

  const [groupsOptions, setGroupsOptions] = useState<{ value: string; label: string }[]>([]);
  const [formOptions, setFormOptions] = useState<{ value: string; label: string }[]>([]);
  const [assetOptions, setAssetOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    (async () => {
      const groups = await AdminGroupApi.getGroups({ page: 1, pageSize: 1000 });
      setGroupsOptions(groups.groups.map(g => ({ value: String(g.id), label: g.name })));
      const tables = await AdminDataApi.listDataTables();
      setFormOptions((tables.dataTables || []).map((t: any) => ({ value: String(t.id), label: t.displayName || t.name })));
      const assets = await AdminAssetApi.getAssets({ page: 1, pageSize: 1000 });
      setAssetOptions(assets.assets.map(a => ({ value: a.file_name, label: a.original_name || a.file_name })));
    })();
  }, []);

  // Emit to parent when config changes, but only when it differs from last emitted
  useEffect(() => {
    const nextJson = JSON.stringify(config);
    if (nextJson !== lastEmittedJsonRef.current) {
      lastEmittedJsonRef.current = nextJson;
      onChange(config);
    }
  }, [config]);

  const scheduleTypeData = useMemo(() => scheduleTypes.map(l => ({ value: l.lookupCode, label: l.lookupValue })), [scheduleTypes]);
  const timePeriodData = useMemo(() => timePeriod.map(l => ({ value: l.lookupCode, label: l.lookupValue })), [timePeriod]);
  const weekdaysData = useMemo(() => weekdays.map(l => ({ value: l.lookupCode, label: l.lookupValue })), [weekdays]);

  const addBlock = () => setConfig((prev: any) => ({
    ...prev,
    blocks: [
      ...ensureArray(prev.blocks),
      {
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
      }
    ]
  }));
  const removeBlock = (index: number) => setConfig((prev: any) => ({ ...prev, blocks: ensureArray(prev.blocks).filter((_: any, i: number) => i !== index) }));
  const setBlock = (index: number, patch: any) => setConfig((prev: any) => ({ ...prev, blocks: ensureArray(prev.blocks).map((b: any, i: number) => i === index ? { ...b, ...patch } : b) }));

  const addJob = (bIndex: number) => setBlock(bIndex, { jobs: [...ensureArray(config.blocks?.[bIndex]?.jobs), {
    job_name: 'Job',
    job_type: 'notification',
    schedule_time: {
      job_schedule_types: 'immediately'
    },
    notification: {
      notification_types: 'email',
      recipient: '@user'
    }
  }] });
  const removeJob = (bIndex: number, jIndex: number) => setBlock(bIndex, { jobs: ensureArray(config.blocks?.[bIndex]?.jobs).filter((_: any, i: number) => i !== jIndex) });
  const setJob = (bIndex: number, jIndex: number, patch: any) => setBlock(bIndex, { jobs: ensureArray(config.blocks?.[bIndex]?.jobs).map((j: any, i: number) => i === jIndex ? { ...j, ...patch } : j) });

  const addReminder = (bIndex: number, jIndex: number) => setJob(bIndex, jIndex, {
    reminders: [...ensureArray(config.blocks?.[bIndex]?.jobs?.[jIndex]?.reminders), {
      condition: '',
      on_job_execute: { condition: '' },
      schedule_time: {
        send_after: 1,
        send_after_type: 'days'
      },
      notification: { notification_types: 'email', recipient: '@user' }
    }]
  });

  const removeReminder = (bIndex: number, jIndex: number, rIndex: number) => setJob(bIndex, jIndex, {
    reminders: ensureArray(config.blocks?.[bIndex]?.jobs?.[jIndex]?.reminders).filter((_: any, idx: number) => idx !== rIndex)
  });

  const setReminder = (bIndex: number, jIndex: number, rIndex: number, patch: any) => setJob(bIndex, jIndex, {
    reminders: ensureArray(config.blocks?.[bIndex]?.jobs?.[jIndex]?.reminders).map((r: any, idx: number) => idx === rIndex ? { ...r, ...patch } : r)
  });

  // active tabs
  const [activeBlock, setActiveBlock] = useState<string>('0');
  const [activeJobByBlock, setActiveJobByBlock] = useState<Record<number, string>>({ 0: '0' });
  const [activeReminderByJobAndBlock, setActiveReminderByJobAndBlock] = useState<Record<string, string>>({ '0-0': '0' });
  useEffect(() => {
    // keep active indices in bounds
    const blocks = ensureArray(config.blocks);
    const bi = Number(activeBlock) || 0;
    if (bi >= blocks.length) setActiveBlock('0');

    let needsJobUpdate = false;
    const newJobMap = { ...activeJobByBlock };

    blocks.forEach((_, i) => {
      const jobs = ensureArray((blocks[i] as any).jobs);
      const aj = Number(newJobMap[i] || '0');
      if (aj >= jobs.length) {
        newJobMap[i] = '0';
        needsJobUpdate = true;
      }
    });

    if (needsJobUpdate) {
      setActiveJobByBlock(newJobMap);
    }
  }, [config.blocks, activeBlock]);

  useEffect(() => {
    // Keep reminder indices in bounds - separate effect to avoid circular dependencies
    const blocks = ensureArray(config.blocks);
    let needsReminderUpdate = false;
    const newReminderMap = { ...activeReminderByJobAndBlock };

    blocks.forEach((_, i) => {
      const jobs = ensureArray((blocks[i] as any).jobs);
      jobs.forEach((_, j) => {
        const reminders = ensureArray((jobs[j] as any).reminders);
        const key = `${i}-${j}`;
        const ar = Number(newReminderMap[key] || '0');
        if (ar >= reminders.length) {
          newReminderMap[key] = '0';
          needsReminderUpdate = true;
        }
      });
    });

    if (needsReminderUpdate) {
      setActiveReminderByJobAndBlock(newReminderMap);
    }
  }, [config.blocks]);

  // memoized date value for Mantine component, avoids TS complaints
  const deadlineDate = useMemo<Date | null>(() => {
    const str = (config?.repeater_until_date?.deadline ?? '') as unknown as string;
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }, [config?.repeater_until_date?.deadline]);

  const top = (
    <Stack gap="md">
      {/* Global Condition */}
      <Card withBorder>
        <Stack gap="sm">
          <Text fw={600}>Global Condition</Text>
          <ConditionBuilderField fieldId={1} fieldName="root.condition" value={config.condition || ''} onChange={(v) => setConfig((p: any) => ({ ...p, condition: v }))} />
        </Stack>
      </Card>

      {/* Main Configuration Options */}
      <Card withBorder>
        <Stack gap="sm">
          <Text fw={600}>Configuration Options</Text>

          {/* Core Options Row */}
          <Group gap="lg" align="center">
            <Switch
              checked={!!config.randomize}
              onChange={(e) => setConfig({ ...config, randomize: e.currentTarget.checked })}
              label="Randomize"
              size="sm"
            />
            <Switch
              checked={!!config.repeat}
              onChange={(e) => setConfig({ ...config, repeat: e.currentTarget.checked })}
              label="Repeat"
              size="sm"
            />
            <Switch
              checked={!!config.repeat_until_date}
              onChange={(e) => setConfig({ ...config, repeat_until_date: e.currentTarget.checked })}
              label="Repeat until date"
              size="sm"
            />
            <Switch
              checked={!!config.target_groups}
              onChange={(e) => setConfig({ ...config, target_groups: e.currentTarget.checked })}
              label="Target groups"
              size="sm"
            />
            <Switch
              checked={!!config.overwrite_variables}
              onChange={(e) => setConfig({ ...config, overwrite_variables: e.currentTarget.checked })}
              label="Overwrite vars"
              size="sm"
            />
          </Group>

          {/* Cleanup Options Row */}
          <Group gap="lg" align="center">
            <Switch
              checked={!!config.clear_existing_jobs_for_action}
              onChange={(e) => setConfig({ ...config, clear_existing_jobs_for_action: e.currentTarget.checked })}
              label="Clear Scheduled Jobs for This Action"
              size="sm"
            />
            <Switch
              checked={!!config.clear_existing_jobs_for_record_and_action}
              onChange={(e) => setConfig({ ...config, clear_existing_jobs_for_record_and_action: e.currentTarget.checked })}
              label="Clear Scheduled Jobs for This Action & Record"
              size="sm"
            />
          </Group>
        </Stack>
      </Card>

      {/* Conditional Configuration Sections */}
      <div className={classes.gridContainer}>
        {/* Randomization Options */}
        {config.randomize && (
          <div className={classes.gridCol6}>
            <Card withBorder>
              <Stack gap="sm">
                <Text fw={600} size="sm">Randomization</Text>
                <Group grow>
                  <Switch
                    checked={!!(config.randomizer?.even_presentation)}
                    onChange={(e) => setConfig({ ...config, randomizer: { ...(config.randomizer||{}), even_presentation: e.currentTarget.checked } })}
                    label="Even presentation"
                    size="sm"
                  />
                  <NumberInput
                    label="Random elements"
                    min={1}
                    value={config.randomizer?.random_elements ?? 1}
                    onChange={(v) => setConfig({ ...config, randomizer: { ...(config.randomizer||{}), random_elements: Number(v)||1 } })}
                    size="sm"
                  />
                </Group>
              </Stack>
            </Card>
          </div>
        )}

        {/* Target Groups */}
        {config.target_groups && (
          <div className={config.randomize ? classes.gridCol6 : classes.gridCol12}>
            <Card withBorder>
              <Stack gap="sm">
                <Text fw={600} size="sm">Target Groups</Text>
                <MultiSelect
                  label="Select groups"
                  data={groupsOptions}
                  value={config.selected_target_groups || []}
                  onChange={(v) => setConfig({ ...config, selected_target_groups: v })}
                  searchable
                  clearable
                  size="sm"
                />
              </Stack>
            </Card>
          </div>
        )}

        {/* Overwrite Variables */}
        {config.overwrite_variables && (
          <div className={classes.gridCol12}>
            <Card withBorder>
              <Stack gap="sm">
                <Text fw={600} size="sm">Variable Overrides</Text>
                <MultiSelect
                  label="Variables to override"
                  data={[
                    { value: 'send_after', label: 'send_after' },
                    { value: 'send_after_type', label: 'send_after_type' },
                    { value: 'send_on_day_at', label: 'send_on_day_at' },
                    { value: 'custom_time', label: 'custom_time' },
                    { value: 'impersonate_user_code', label: 'impersonate_user_code' },
                  ]}
                  value={config.selected_overwrite_variables || []}
                  onChange={(v)=> setConfig({ ...config, selected_overwrite_variables: v })}
                  searchable
                  clearable
                  size="sm"
                />
              </Stack>
            </Card>
          </div>
        )}
      </div>

      {/* Scheduling Options */}
      {(config.repeat || config.repeat_until_date) && (
        <Card withBorder>
          <Stack gap="md">
            <Text fw={600}>Scheduling Configuration</Text>

            {config.repeat && (
              <div>
                <Text fw={500} size="sm" mb="xs">Standard Repeat</Text>
                <div className={classes.gridContainerTight}>
                  <div className={classes.gridCol3}>
                    <NumberInput
                      label="Occurrences"
                      min={1}
                      value={config.repeater?.occurrences ?? 1}
                      onChange={(v) => setConfig({ ...config, repeater: { ...(config.repeater||{}), occurrences: Number(v)||1 } })}
                      size="sm"
                    />
                  </div>
                  <div className={classes.gridCol3}>
                    <Select
                      label="Frequency"
                      data={[{value:'day',label:'Day'},{value:'week',label:'Week'},{value:'month',label:'Month'}]}
                      value={config.repeater?.frequency || null}
                      onChange={(v)=> setConfig({ ...config, repeater: { ...(config.repeater||{}), frequency: v||undefined } })}
                      size="sm"
                    />
                  </div>
                  {config.repeater?.frequency === 'week' && (
                    <div className={classes.gridCol6}>
                      <MultiSelect
                        label="Week days"
                        data={weekdaysData}
                        value={ensureArray(config.repeater?.daysOfWeek)}
                        onChange={(v)=> setConfig({ ...config, repeater: { ...(config.repeater||{}), daysOfWeek: v } })}
                        searchable
                        clearable
                        size="sm"
                      />
                    </div>
                  )}
                  {config.repeater?.frequency === 'month' && (
                    <div className={classes.gridCol6}>
                      <MultiSelect
                        label="Month days"
                        data={daysOfMonthOptions}
                        value={ensureArray(config.repeater?.daysOfMonth)}
                        onChange={(v)=> setConfig({ ...config, repeater: { ...(config.repeater||{}), daysOfMonth: v } })}
                        searchable
                        clearable
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {config.repeat_until_date && (
              <div>
                <Text fw={500} size="sm" mb="xs">Repeat Until Deadline</Text>
                <div className={classes.gridContainerTight}>
                  <div className={classes.gridCol4}>
                    <DateTimePicker
                      label="Deadline"
                      value={deadlineDate}
                      onChange={(val) => setConfig({
                        ...config,
                        repeater_until_date: {
                          ...(config.repeater_until_date || {}),
                          deadline: val ? (val as unknown as Date).toISOString() : ''
                        }
                      })}
                      size="sm"
                    />
                  </div>
                  <div className={classes.gridCol2}>
                    <TimeInput
                      label="Schedule at"
                      value={config.repeater_until_date?.schedule_at || ''}
                      onChange={(e)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), schedule_at: (e.currentTarget as any).value } })}
                      size="sm"
                    />
                  </div>
                  <div className={classes.gridCol3}>
                    <Select
                      label="Repeat every"
                      data={repeatEveryOptions}
                      value={String(config.repeater_until_date?.repeat_every ?? 1)}
                      onChange={(v)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), repeat_every: Number(v)||1 } })}
                      size="sm"
                    />
                  </div>
                  <div className={classes.gridCol3}>
                    <Select
                      label="Frequency"
                      data={[{value:'day',label:'Day'},{value:'week',label:'Week'},{value:'month',label:'Month'}]}
                      value={config.repeater_until_date?.frequency || null}
                      onChange={(v)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), frequency: v||undefined } })}
                      size="sm"
                    />
                  </div>
                </div>

                {(config.repeater_until_date?.frequency === 'week' || config.repeater_until_date?.frequency === 'month') && (
                  <div className={`${classes.gridContainerTight} ${classes.marginTop4}`}>
                    {config.repeater_until_date?.frequency === 'week' && (
                      <div className={classes.gridCol6}>
                        <MultiSelect
                          label="Week days"
                          data={weekdaysData}
                          value={ensureArray(config.repeater_until_date?.daysOfWeek)}
                          onChange={(v)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), daysOfWeek: v } })}
                          searchable
                          clearable
                          size="sm"
                        />
                      </div>
                    )}
                    {config.repeater_until_date?.frequency === 'month' && (
                      <div className={classes.gridCol6}>
                        <MultiSelect
                          label="Month days"
                          data={daysOfMonthOptions}
                          value={ensureArray(config.repeater_until_date?.daysOfMonth)}
                          onChange={(v)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), daysOfMonth: v } })}
                          searchable
                          clearable
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  );

  const renderScheduleTime = (job: any, onPatch: (patch: any) => void, blockIndex: number, jobIndex: number) => {
    const st = job.schedule_time || {};
    const customDate: Date | null = st.custom_time ? new Date(String(st.custom_time)) : null;
    return (
      <Card withBorder>
        <Stack gap="sm">
          <Group align="end" gap="sm">
            <Select
              label="Schedule type"
              data={scheduleTypeData}
              value={st.job_schedule_types || null}
              onChange={(v) => onPatch({ schedule_time: { ...st, job_schedule_types: v || undefined } })}
              searchable
              size="sm"
              className={classes.flex1}
            />
            <div className={classes.conditionContainer}>
              <ConditionBuilderField
                fieldId={2000 + blockIndex * 100 + jobIndex}
                fieldName={`blocks.${blockIndex}.jobs.${jobIndex}.condition`}
                value={job.condition || ''}
                onChange={(v) => onPatch({ condition: v })}
                addLabel="Job Condition"
                editLabel="Edit Job Condition"
              />
            </div>
            <div className={classes.conditionContainer}>
              <ConditionBuilderField
                fieldId={2500 + blockIndex * 100 + jobIndex}
                fieldName={`blocks.${blockIndex}.jobs.${jobIndex}.on_job_execute.condition`}
                value={job.on_job_execute?.condition || ''}
                onChange={(v) => onPatch({ on_job_execute: { ...(job.on_job_execute || {}), condition: v } })}
                addLabel="Job Condition on Execute"
                editLabel="Edit Job Condition on Execute"
              />
            </div>
          </Group>

          {st.job_schedule_types === 'after_period' && (
            <div className={classes.gridContainerTight}>
              <div className={classes.gridCol4}>
                <NumberInput
                  label="Send after"
                  min={1}
                  value={st.send_after ?? 1}
                  onChange={(v) => onPatch({ schedule_time: { ...st, send_after: Number(v) || 1 } })}
                  size="sm"
                />
              </div>
              <div className={classes.gridCol4}>
                <Select
                  label="Unit"
                  data={timePeriodData}
                  value={st.send_after_type || 'days'}
                  onChange={(v) => onPatch({ schedule_time: { ...st, send_after_type: v || 'days' } })}
                  size="sm"
                />
              </div>
              <div className={classes.gridCol4}>
                <TimeInput
                  label="at"
                  value={st.send_on_day_at || ''}
                  onChange={(e) => onPatch({ schedule_time: { ...st, send_on_day_at: (e.currentTarget as HTMLInputElement).value || '' } })}
                  withSeconds={false}
                  size="sm"
                />
              </div>
            </div>
          )}

          {st.job_schedule_types === 'after_period_on_day_at_time' && (
            <div className={classes.gridContainerTight}>
              <div className={classes.gridCol4}>
                <Select
                  label="Send on"
                  data={ordinal20Options}
                  value={st.send_on || null}
                  onChange={(v) => onPatch({ schedule_time: { ...st, send_on: v || undefined } })}
                  size="sm"
                />
              </div>
              <div className={classes.gridCol4}>
                <Select
                  label="Week day"
                  data={weekdaysData}
                  value={st.send_on_day || null}
                  onChange={(v) => onPatch({ schedule_time: { ...st, send_on_day: v || undefined } })}
                  size="sm"
                />
              </div>
              <div className={classes.gridCol4}>
                <TimeInput
                  label="at"
                  value={st.send_on_day_at || ''}
                  onChange={(e) => onPatch({ schedule_time: { ...st, send_on_day_at: (e.currentTarget as HTMLInputElement).value || '' } })}
                  withSeconds={false}
                  size="sm"
                />
              </div>
            </div>
          )}

          {st.job_schedule_types === 'on_fixed_datetime' && (
            <DateTimePicker
              label="Select date and time"
              value={customDate ?? null}
              onChange={(val) => onPatch({ schedule_time: { ...st, custom_time: val ? new Date(val as unknown as string).toISOString() : '' } })}
              size="sm"
            />
          )}
        </Stack>
      </Card>
    );
  };

  const renderNotification = (job: any, onPatch: (patch: any) => void, blockIndex: number, jobIndex: number) => {
    const n = job.notification || {};
    return (
      <Card withBorder>
        <Stack gap="sm">
          <Select
            label="Notification type"
            data={[{ value: 'email', label: 'Email' }, { value: 'push_notification', label: 'Push notification' }]}
            value={n.notification_types || 'email'}
            onChange={(v) => onPatch({ notification: { ...n, notification_types: v || 'email' } })}
            size="sm"
          />


          {/* Email-specific fields */}
          {(n.notification_types || 'email') === 'email' && (
            <div className={classes.gridContainerTight}>
              <div className={classes.gridCol6}>
                <TextInput
                  label="Send To (recipient)"
                  description="Enter recipient email address"
                  placeholder="user@example.com"
                  value={n.recipient || "@user"}
                  onChange={(e) => onPatch({ notification: { ...n, recipient: e.currentTarget.value } })}
                  required
                  size="sm"
                />
              </div>
              <div className={classes.gridCol6}>
                <MultiSelect
                  label="Attachments"
                  data={assetOptions}
                  value={n.attachments || []}
                  onChange={(v) => onPatch({ notification: { ...n, attachments: v } })}
                  searchable
                  clearable
                  size="sm"
                />
              </div>
            </div>
          )}

          {/* Push notification specific fields */}
          {n.notification_types === 'push_notification' && (
            <div className={classes.gridContainerTight}>
              <div className={classes.gridCol6}>
                <TextInput
                  label="Send To (recipient)"
                  description="Use @users for all users, or specify individual recipients"
                  placeholder="@users"
                  value={n.recipient || "@users"}
                  onChange={(e) => onPatch({ notification: { ...n, recipient: e.currentTarget.value } })}
                  required
                  size="sm"
                />
              </div>
              <div className={classes.gridCol6}>
                <TextInput
                  label="Redirect to URL"
                  placeholder="Enter URL or select page keyword"
                  value={n.redirect_url || ''}
                  onChange={(e) => onPatch({ notification: { ...n, redirect_url: e.currentTarget.value } })}
                  size="sm"
                />
              </div>
            </div>
          )}

          {/* Subject and Body fields for both email and push notifications */}
          <GroupedTranslationInput
            subjectValue={localTranslations[`block_${blockIndex}.job_${jobIndex}.notification.subject`] || {}}
            bodyValue={localTranslations[`block_${blockIndex}.job_${jobIndex}.notification.body`] || {}}
            subjectPlaceholder={n.notification_types === 'email' ? "Enter email subject" : "Enter notification title"}
            bodyPlaceholder={n.notification_types === 'email' ? "Enter email body content" : "Enter notification message"}
            onSubjectChange={(translations) => {
              setLocalTranslations(prev => ({
                ...prev,
                [`block_${blockIndex}.job_${jobIndex}.notification.subject`]: translations
              }));
              // Also store the translation key in the config
              setJob(blockIndex, jobIndex, {
                notification: {
                  ...n,
                  subject: `block_${blockIndex}.job_${jobIndex}.notification.subject`
                }
              });
            }}
            onBodyChange={(translations) => {
              setLocalTranslations(prev => ({
                ...prev,
                [`block_${blockIndex}.job_${jobIndex}.notification.body`]: translations
              }));
              // Also store the translation key in the config
              setJob(blockIndex, jobIndex, {
                notification: {
                  ...n,
                  body: `block_${blockIndex}.job_${jobIndex}.notification.body`
                }
              });
            }}
            required
          />
        </Stack>
      </Card>
    );
  };

  const renderReminderScheduleTime = (reminder: any, onPatch: (patch: any) => void, parentJobType: string) => {
    const st = reminder.schedule_time || {};
    return (
      <Card withBorder>
        <Stack gap="sm">
          <Text size="sm" fw={600}>Reminder schedule time</Text>
          <Text size="xs" c="dimmed">Define how much time after the notification, the reminder will be sent</Text>

          <Group align="end" gap="sm">
            <NumberInput
              label="Send after"
              min={1}
              value={st.send_after ?? 1}
              onChange={(v) => onPatch({ schedule_time: { ...st, send_after: Number(v) || 1 } })}
              size="sm"
              className={classes.flex1}
            />
            <Select
              label="&nbsp;"
              data={timePeriodData}
              value={st.send_after_type || 'days'}
              onChange={(v) => onPatch({ schedule_time: { ...st, send_after_type: v || 'days' } })}
              size="sm"
              className={classes.width120}
            />
          </Group>

          {/* Additional fields for diary reminders */}
          {parentJobType === 'notification_with_reminder_for_diary' && (
            <div>
              <Group align="end" gap="sm">
                <NumberInput
                  label="Valid for"
                  min={1}
                  value={st.valid ?? 1}
                  onChange={(v) => onPatch({ schedule_time: { ...st, valid: Number(v) || 1 } })}
                  size="sm"
                  className={classes.validForInput}
                />
                <Select
                  label="&nbsp;"
                  data={timePeriodData}
                  value={st.valid_type || 'hours'}
                  onChange={(v) => onPatch({ schedule_time: { ...st, valid_type: v || 'hours' } })}
                  size="sm"
                  className={classes.validForSelect}
                />
              </Group>
              <Text size="xs" c="dimmed" className={classes.validForDescription}>
                For how much time the reminder is valid after it was sent
              </Text>
            </div>
          )}
        </Stack>
      </Card>
    );
  };

  const renderReminder = (reminder: any, onPatch: (patch: any) => void, blockIndex: number, jobIndex: number, reminderIndex: number, parentJobType: string) => {
    return (
      <Stack gap="sm">
        {/* Reminder conditions on same row */}
        <div className={classes.jobConditionsRow}>
          <ConditionBuilderField
            fieldId={3000 + blockIndex * 100 + jobIndex * 10 + reminderIndex}
            fieldName={`blocks.${blockIndex}.jobs.${jobIndex}.reminders.${reminderIndex}.condition`}
            value={reminder.condition || ''}
            onChange={(v) => onPatch({ condition: v })}
            addLabel="Add Reminder Condition"
            editLabel="Edit Reminder Condition"
          />
          <ConditionBuilderField
            fieldId={4000 + blockIndex * 100 + jobIndex * 10 + reminderIndex}
            fieldName={`blocks.${blockIndex}.jobs.${jobIndex}.reminders.${reminderIndex}.on_job_execute.condition`}
            value={reminder.on_job_execute?.condition || ''}
            onChange={(v) => onPatch({ on_job_execute: { ...(reminder.on_job_execute || {}), condition: v } })}
            addLabel="Add Reminder Execute Condition"
            editLabel="Edit Reminder Execute Condition"
          />
        </div>

        {/* Reminder schedule time */}
        {renderReminderScheduleTime(reminder, onPatch, parentJobType)}

        {/* Reminder notification */}
        {renderNotification(reminder, onPatch, blockIndex, jobIndex)}
      </Stack>
    );
  };

  const blocks = ensureArray(config.blocks);

  return (
    <Tabs defaultValue="builder">
      <Tabs.List>
        <Tabs.Tab value="builder">Builder</Tabs.Tab>
        <Tabs.Tab value="json">JSON</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="builder" pt="md">
        <Stack gap="md">
          {top}

          <Card withBorder>
            <Tabs value={activeBlock} onChange={(v)=> setActiveBlock(v || '0')}>
              <Group justify="space-between" mb="sm">
                <Tabs.List>
                  {blocks.map((b: any, i: number) => (
                    <Tabs.Tab key={i} value={String(i)}>
                      <Group gap={6} align="center">
                        <Text>{b.block_name ? `${i+1} - ${b.block_name}` : `Block ${i+1}`}</Text>
                      </Group>
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
                <Group gap="xs">
                  <Button leftSection={<IconPlus size={16} />} variant="light" onClick={addBlock}>Add Block</Button>
                  {blocks.length > 0 && (
                    <ActionIcon variant="subtle" color="red" onClick={() => removeBlock(Number(activeBlock)||0)}><IconTrash size={16} /></ActionIcon>
                  )}
                </Group>
              </Group>

              {blocks.map((block: any, bIndex: number) => (
                <Tabs.Panel key={bIndex} value={String(bIndex)}>
                  <Stack gap="sm">
                    <Group align="end" gap="sm">
                      <TextInput
                        label="Block name"
                        value={block.block_name || ''}
                        onChange={(e) => setBlock(bIndex, { block_name: e.currentTarget.value })}
                        size="sm"
                        className={classes.flex1}
                      />
                      <div className={classes.conditionContainer}>
                        <ConditionBuilderField
                            fieldId={1000 + bIndex}
                            fieldName={`blocks.${bIndex}.condition`}
                            value={block.condition || ''}
                            onChange={(v) => setBlock(bIndex, { condition: v })}
                            addLabel="Add Block Condition"
                            editLabel="Edit Block Condition"
                        />
                      </div>
                    </Group>

                    {/* Jobs Tabs */}
                    <Card withBorder>
                      <Tabs value={activeJobByBlock[bIndex] || '0'} onChange={(v)=> setActiveJobByBlock((prev)=> ({ ...prev, [bIndex]: v || '0' }))}>
                        <Group justify="space-between" mb="sm">
                          <Tabs.List>
                            {ensureArray(block.jobs).map((jobIt: any, jIndex: number) => (
                              <Tabs.Tab key={jIndex} value={String(jIndex)}>
                                {jobIt?.job_name ? `${jIndex+1} - ${jobIt.job_name}` : `Job ${jIndex+1}`}
                              </Tabs.Tab>
                            ))}
                          </Tabs.List>
                          <Group gap="xs">
                            <Button leftSection={<IconPlus size={16} />} variant="light" onClick={() => addJob(bIndex)}>Add Job</Button>
                            {ensureArray(block.jobs).length > 0 && (
                              <ActionIcon variant="subtle" color="red" onClick={() => removeJob(bIndex, Number(activeJobByBlock[bIndex]||'0'))}><IconTrash size={16} /></ActionIcon>
                            )}
                          </Group>
                        </Group>

                        {ensureArray(block.jobs).map((job: any, jIndex: number) => (
                          <Tabs.Panel key={jIndex} value={String(jIndex)}>
                            <Card withBorder>
                              <Stack gap="sm">
                                {/* Job Name and Type Row */}
                                <div className={classes.jobRow}>
                                  <TextInput
                                    label="Job name"
                                    value={job.job_name || ''}
                                    onChange={(e) => setJob(bIndex, jIndex, { job_name: e.currentTarget.value })}
                                    size="sm"
                                    className={['notification_with_reminder', 'notification_with_reminder_for_diary'].includes(job.job_type) ? classes.jobInputThree : classes.jobInputTwo}
                                  />
                                  <Select
                                    label="Job type"
                                    data={[
                                      { value: 'add_group', label: 'Add group' },
                                      { value: 'remove_group', label: 'Remove group' },
                                      { value: 'notification', label: 'Schedule notification' },
                                      { value: 'notification_with_reminder', label: 'Schedule notification with reminders' },
                                      { value: 'notification_with_reminder_for_diary', label: 'Schedule notification with reminders for a diary' },
                                    ]}
                                    value={job.job_type || null}
                                    onChange={(v) => {
                                      const newJobType = v || undefined;
                                      const isNotificationType = newJobType && newJobType.includes('notification');
                                      const wasNotificationType = job.job_type && job.job_type.includes('notification');

                                      // Initialize notification object when switching to notification type
                                      if (isNotificationType && !wasNotificationType) {
                                        setJob(bIndex, jIndex, {
                                          job_type: newJobType,
                                          notification: {
                                            notification_types: 'email'
                                          }
                                        });
                                      } else {
                                        setJob(bIndex, jIndex, { job_type: newJobType });
                                      }
                                    }}
                                    size="sm"
                                    className={['notification_with_reminder', 'notification_with_reminder_for_diary'].includes(job.job_type) ? classes.jobInputThree : classes.jobInputTwo}
                                  />
                                  {['notification_with_reminder', 'notification_with_reminder_for_diary'].includes(job.job_type) && (
                                    <Select
                                      label="Reminder for"
                                      data={formOptions}
                                      value={job.reminder_form_id || null}
                                      onChange={(v) => setJob(bIndex, jIndex, { reminder_form_id: v || undefined })}
                                      placeholder="Select data table"
                                      size="sm"
                                      className={classes.jobInputThree}
                                    />
                                  )}
                                </div>

                                {/* Schedule time */}
                                {renderScheduleTime(job, (patch) => setJob(bIndex, jIndex, patch), bIndex, jIndex)}

                                {/* Group add/remove */}
                                {['add_group', 'remove_group'].includes(job.job_type) && (
                                  <MultiSelect
                                    label="Group"
                                    data={groupsOptions}
                                    value={job.job_add_remove_groups || []}
                                    onChange={(v) => setJob(bIndex, jIndex, { job_add_remove_groups: v })}
                                    searchable
                                    size="sm"
                                  />
                                )}

                                {/* Notification */}
                                {['notification', 'notification_with_reminder', 'notification_with_reminder_for_diary'].includes(job.job_type) && (
                                  renderNotification(job, (patch) => setJob(bIndex, jIndex, patch), bIndex, jIndex)
                                )}

                                {/* Reminders */}
                                {['notification_with_reminder', 'notification_with_reminder_for_diary'].includes(job.job_type) && (
                                  <Card withBorder>
                                    <Tabs
                                      value={activeReminderByJobAndBlock[`${bIndex}-${jIndex}`] || '0'}
                                      onChange={(v) => setActiveReminderByJobAndBlock((prev) => ({ ...prev, [`${bIndex}-${jIndex}`]: v || '0' }))}
                                    >
                                      <Group justify="space-between" mb="sm">
                                        <Tabs.List>
                                          {ensureArray(job.reminders).map((reminder: any, rIndex: number) => (
                                            <Tabs.Tab key={rIndex} value={String(rIndex)}>
                                              {`Reminder ${rIndex + 1}`}
                                            </Tabs.Tab>
                                          ))}
                                        </Tabs.List>
                                        <Group gap="xs">
                                          <Button leftSection={<IconPlus size={16} />} variant="light" onClick={() => addReminder(bIndex, jIndex)}>
                                            Add Reminder
                                          </Button>
                                          {ensureArray(job.reminders).length > 0 && (
                                            <ActionIcon
                                              variant="subtle"
                                              color="red"
                                              onClick={() => removeReminder(bIndex, jIndex, Number(activeReminderByJobAndBlock[`${bIndex}-${jIndex}`] || '0'))}
                                            >
                                              <IconTrash size={16} />
                                            </ActionIcon>
                                          )}
                                        </Group>
                                      </Group>

                                      {ensureArray(job.reminders).map((reminder: any, rIndex: number) => (
                                        <Tabs.Panel key={rIndex} value={String(rIndex)}>
                                          <Stack gap="sm">
                                            {renderReminder(reminder, (patch) => setReminder(bIndex, jIndex, rIndex, patch), bIndex, jIndex, rIndex, job.job_type)}
                                          </Stack>
                                        </Tabs.Panel>
                                      ))}

                                      {(!job.reminders || job.reminders.length === 0) && (
                                        <Text size="xs" c="dimmed" ta="center" py="md">
                                          No reminders configured
                                        </Text>
                                      )}
                                    </Tabs>
                                  </Card>
                                )}
                              </Stack>
                            </Card>
                          </Tabs.Panel>
                        ))}
                      </Tabs>
                    </Card>
                  </Stack>
                </Tabs.Panel>
              ))}
            </Tabs>
          </Card>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="json" pt="md">
        <MonacoFieldEditor value={JSON.stringify(config, null, 2)} onChange={(val) => {
          try {
            const parsed = JSON.parse(val || '{}');
            setConfig(parsed);
          } catch {}
        }} language="json" height={600} />
      </Tabs.Panel>
    </Tabs>
  );
}


