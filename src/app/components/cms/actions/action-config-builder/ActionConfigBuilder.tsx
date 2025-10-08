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
import { useAdminLanguages } from '../../../../../hooks/useLanguages';
import { TranslationInput } from '../translation-input/TranslationInput';
import { LocalizableInput } from '../localizable-input/LocalizableInput';
import { useActionTranslations } from '../../../../../hooks/useActionTranslations';

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
  const { getTranslationWithFallback } = useActionTranslations(actionId || 0);

  // Notify parent when local translations change
  useEffect(() => {
    if (onTranslationsChange && !actionId) {
      onTranslationsChange(localTranslations);
    }
  }, [localTranslations, onTranslationsChange, actionId]);

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
      { block_name: 'Block', jobs: [{ job_name: 'Job', job_type: 'notification', schedule_time: {} }] }
    ]
  }));
  const removeBlock = (index: number) => setConfig((prev: any) => ({ ...prev, blocks: ensureArray(prev.blocks).filter((_: any, i: number) => i !== index) }));
  const setBlock = (index: number, patch: any) => setConfig((prev: any) => ({ ...prev, blocks: ensureArray(prev.blocks).map((b: any, i: number) => i === index ? { ...b, ...patch } : b) }));

  const addJob = (bIndex: number) => setBlock(bIndex, { jobs: [...ensureArray(config.blocks?.[bIndex]?.jobs), { job_name: 'Job', job_type: 'notification', schedule_time: {} }] });
  const removeJob = (bIndex: number, jIndex: number) => setBlock(bIndex, { jobs: ensureArray(config.blocks?.[bIndex]?.jobs).filter((_: any, i: number) => i !== jIndex) });
  const setJob = (bIndex: number, jIndex: number, patch: any) => setBlock(bIndex, { jobs: ensureArray(config.blocks?.[bIndex]?.jobs).map((j: any, i: number) => i === jIndex ? { ...j, ...patch } : j) });

  // active tabs
  const [activeBlock, setActiveBlock] = useState<string>('0');
  const [activeJobByBlock, setActiveJobByBlock] = useState<Record<number, string>>({ 0: '0' });
  useEffect(() => {
    // keep active indices in bounds
    const blocks = ensureArray(config.blocks);
    const bi = Number(activeBlock) || 0;
    if (bi >= blocks.length) setActiveBlock('0');
    blocks.forEach((_, i) => {
      const jobs = ensureArray((blocks[i] as any).jobs);
      const map = activeJobByBlock as Record<number, string>;
      const aj = Number(map[i] || '0');
      if (aj >= jobs.length) setActiveJobByBlock((prev) => ({ ...prev, [i]: '0' }));
    });
  }, [config.blocks, activeBlock, activeJobByBlock]);

  // memoized date value for Mantine component, avoids TS complaints
  const deadlineDate = useMemo<Date | null>(() => {
    const str = (config?.repeater_until_date?.deadline ?? '') as unknown as string;
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }, [config?.repeater_until_date?.deadline]);

  const top = (
    <Stack gap="md">
      <Card withBorder>
        <Stack gap="sm">
          <Text fw={600}>Global Condition</Text>
          <ConditionBuilderField fieldId={1} fieldName="root.condition" value={config.condition || ''} onChange={(v) => setConfig((p: any) => ({ ...p, condition: v }))} />
        </Stack>
      </Card>

      <Card withBorder>
        <Stack gap="sm">
          <Text fw={600}>Options</Text>
          <Group>
            <Switch checked={!!config.randomize} onChange={(e) => setConfig({ ...config, randomize: e.currentTarget.checked })} label="Randomize" />
            <Switch checked={!!config.repeat} onChange={(e) => setConfig({ ...config, repeat: e.currentTarget.checked })} label="Repeat" />
            <Switch checked={!!config.repeat_until_date} onChange={(e) => setConfig({ ...config, repeat_until_date: e.currentTarget.checked })} label="Repeat until date" />
            <Switch checked={!!config.target_groups} onChange={(e) => setConfig({ ...config, target_groups: e.currentTarget.checked })} label="Target groups" />
            <Switch checked={!!config.overwrite_variables} onChange={(e) => setConfig({ ...config, overwrite_variables: e.currentTarget.checked })} label="Overwrite variables" />
          </Group>
        </Stack>
      </Card>
      {config.randomize && (
        <Card withBorder>
          <Stack gap="sm">
            <Text fw={600}>Randomizer</Text>
            <Group grow>
              <Switch checked={!!(config.randomizer?.even_presentation)} onChange={(e) => setConfig({ ...config, randomizer: { ...(config.randomizer||{}), even_presentation: e.currentTarget.checked } })} label="Evenly present blocks" />
              <NumberInput label="Randomly present" min={1} value={config.randomizer?.random_elements ?? 1} onChange={(v) => setConfig({ ...config, randomizer: { ...(config.randomizer||{}), random_elements: Number(v)||1 } })} />
            </Group>
          </Stack>
        </Card>
      )}
      <Card withBorder>
        <Stack gap="sm">
          <Text fw={600}>Cleanup</Text>
          <Group>
            <Switch checked={!!config.clear_existing_jobs_for_action} onChange={(e) => setConfig({ ...config, clear_existing_jobs_for_action: e.currentTarget.checked })} label="Clear Scheduled Jobs for This Action" />
            <Switch checked={!!config.clear_existing_jobs_for_record_and_action} onChange={(e) => setConfig({ ...config, clear_existing_jobs_for_record_and_action: e.currentTarget.checked })} label="Clear Scheduled Jobs for This Action & Record" />
          </Group>
        </Stack>
      </Card>
      {config.repeat && (
        <Card withBorder>
          <Stack gap="sm">
            <Text fw={600}>Repeater</Text>
            <Group grow>
              <NumberInput label="Occurrences" min={1} value={config.repeater?.occurrences ?? 1} onChange={(v) => setConfig({ ...config, repeater: { ...(config.repeater||{}), occurrences: Number(v)||1 } })} />
              <Select label="Repeat every" data={[{value:'day',label:'Day'},{value:'week',label:'Week'},{value:'month',label:'Month'}]} value={config.repeater?.frequency || null} onChange={(v)=> setConfig({ ...config, repeater: { ...(config.repeater||{}), frequency: v||undefined } })} />
            </Group>
            {config.repeater?.frequency === 'week' && (
              <MultiSelect
                label="Select week days"
                data={weekdaysData}
                value={ensureArray(config.repeater?.daysOfWeek)}
                onChange={(v)=> setConfig({ ...config, repeater: { ...(config.repeater||{}), daysOfWeek: v } })}
                searchable
                clearable
              />
            )}
            {config.repeater?.frequency === 'month' && (
              <MultiSelect
                label="Select days of month"
                data={daysOfMonthOptions}
                value={ensureArray(config.repeater?.daysOfMonth)}
                onChange={(v)=> setConfig({ ...config, repeater: { ...(config.repeater||{}), daysOfMonth: v } })}
                searchable
                clearable
              />
            )}
          </Stack>
        </Card>
      )}
      {config.repeat_until_date && (
        <Card withBorder>
          <Stack gap="sm">
            <Text fw={600}>Repeat until date</Text>
            <Group grow>
              <DateTimePicker
                label="Until deadline"
                value={deadlineDate}
                onChange={(val) => setConfig({
                  ...config,
                  repeater_until_date: {
                    ...(config.repeater_until_date || {}),
                    deadline: val ? (val as unknown as Date).toISOString() : ''
                  }
                })}
              />
              <TimeInput label="Schedule at" value={config.repeater_until_date?.schedule_at || ''} onChange={(e)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), schedule_at: (e.currentTarget as any).value } })} />
            </Group>
            <Group grow>
              <Select
                label="Repeat"
                data={repeatEveryOptions}
                value={String(config.repeater_until_date?.repeat_every ?? 1)}
                onChange={(v)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), repeat_every: Number(v)||1 } })}
              />
              <Select label="Frequency" data={[{value:'day',label:'Day'},{value:'week',label:'Week'},{value:'month',label:'Month'}]} value={config.repeater_until_date?.frequency || null} onChange={(v)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), frequency: v||undefined } })} />
            </Group>
            {config.repeater_until_date?.frequency === 'week' && (
              <MultiSelect
                label="Select week days"
                data={weekdaysData}
                value={ensureArray(config.repeater_until_date?.daysOfWeek)}
                onChange={(v)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), daysOfWeek: v } })}
                searchable
                clearable
              />
            )}
            {config.repeater_until_date?.frequency === 'month' && (
              <MultiSelect
                label="Select days of month"
                data={daysOfMonthOptions}
                value={ensureArray(config.repeater_until_date?.daysOfMonth)}
                onChange={(v)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), daysOfMonth: v } })}
                searchable
                clearable
              />
            )}
          </Stack>
        </Card>
      )}
      {config.target_groups && (
        <Card withBorder>
          <Stack gap="sm">
            <Text fw={600}>Targets</Text>
            <MultiSelect label="Select target groups" data={groupsOptions} value={config.selected_target_groups || []} onChange={(v) => setConfig({ ...config, selected_target_groups: v })} searchable clearable />
          </Stack>
        </Card>
      )}
      {config.overwrite_variables && (
        <Card withBorder>
          <Stack gap="sm">
            <Text fw={600}>Overwrite variables</Text>
            <MultiSelect label="Variables" data={[
              { value: 'send_after', label: 'send_after' },
              { value: 'send_after_type', label: 'send_after_type' },
              { value: 'send_on_day_at', label: 'send_on_day_at' },
              { value: 'custom_time', label: 'custom_time' },
              { value: 'impersonate_user_code', label: 'impersonate_user_code' },
            ]} value={config.selected_overwrite_variables || []} onChange={(v)=> setConfig({ ...config, selected_overwrite_variables: v })} searchable clearable />
          </Stack>
        </Card>
      )}
    </Stack>
  );

  const renderScheduleTime = (job: any, onPatch: (patch: any) => void) => {
    const st = job.schedule_time || {};
    const customDate: Date | null = st.custom_time ? new Date(String(st.custom_time)) : null;
    return (
      <Card withBorder>
        <Stack gap="xs">
          <Select label="Schedule type" data={scheduleTypeData} value={st.job_schedule_types || null} onChange={(v) => onPatch({ schedule_time: { ...st, job_schedule_types: v || undefined } })} searchable clearable />
          {st.job_schedule_types === 'after_period' && (
            <Group grow>
              <NumberInput label="Send after" min={1} value={st.send_after ?? 1} onChange={(v) => onPatch({ schedule_time: { ...st, send_after: Number(v) || 1 } })} />
              <Select label="Unit" data={timePeriodData} value={st.send_after_type || 'days'} onChange={(v) => onPatch({ schedule_time: { ...st, send_after_type: v || 'days' } })} />
              <TimeInput
                label="at"
                value={st.send_on_day_at || ''}
                onChange={(e) => onPatch({ schedule_time: { ...st, send_on_day_at: (e.currentTarget as HTMLInputElement).value || '' } })}
                withSeconds={false}
              />
            </Group>
          )}
          {st.job_schedule_types === 'after_period_on_day_at_time' && (
            <Group grow>
              <Select label="Send on" data={ordinal20Options} value={st.send_on || null} onChange={(v) => onPatch({ schedule_time: { ...st, send_on: v || undefined } })} />
              <Select label="Week day" data={weekdaysData} value={st.send_on_day || null} onChange={(v) => onPatch({ schedule_time: { ...st, send_on_day: v || undefined } })} />
              <TimeInput
                label="at"
                value={st.send_on_day_at || ''}
                onChange={(e) => onPatch({ schedule_time: { ...st, send_on_day_at: (e.currentTarget as HTMLInputElement).value || '' } })}
                withSeconds={false}
              />
            </Group>
          )}
          {st.job_schedule_types === 'on_fixed_datetime' && (
            <DateTimePicker
              label="Select date and time"
              value={customDate ?? null}
              onChange={(val) => onPatch({ schedule_time: { ...st, custom_time: val ? new Date(val as unknown as string).toISOString() : '' } })}
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
        <Stack gap="xs">
          <Select label="Notification type" data={[{ value: 'email', label: 'Email' }, { value: 'push_notification', label: 'Push notification' }]} value={n.notification_types || 'email'} onChange={(v) => onPatch({ notification: { ...n, notification_types: v || 'email' } })} />
          {n.notification_types === 'push_notification' && (
            <Group grow>
              <TextInput label="Redirect to URL" value={n.redirect_url || ''} onChange={(e) => onPatch({ notification: { ...n, redirect_url: e.currentTarget.value } })} />
              <TextInput label="Send To (recipient)" value={n.recipient || ''} onChange={(e) => onPatch({ notification: { ...n, recipient: e.currentTarget.value } })} />
            </Group>
          )}
          {n.notification_types === 'email' && (
            <>
              {actionId ? (
                <>
                  <TranslationInput
                    actionId={actionId}
                    translationKey={`block_${blockIndex}.job_${jobIndex}.notification.from_name`}
                    label="From name"
                    placeholder="Enter sender name"
                  />
                  <TranslationInput
                    actionId={actionId}
                    translationKey={`block_${blockIndex}.job_${jobIndex}.notification.from_email`}
                    label="From email"
                    placeholder="Enter sender email"
                  />
                </>
              ) : (
                <Group grow>
                  <TextInput label="From email" value={n.from_email || ''} onChange={(e) => onPatch({ notification: { ...n, from_email: e.currentTarget.value } })} />
                  <TextInput label="From name" value={n.from_name || ''} onChange={(e) => onPatch({ notification: { ...n, from_name: e.currentTarget.value } })} />
                </Group>
              )}
              <Group grow>
                <TextInput label="Reply to" value={n.reply_to || ''} onChange={(e) => onPatch({ notification: { ...n, reply_to: e.currentTarget.value } })} />
              </Group>
              <MultiSelect label="Attachments" data={assetOptions} value={n.attachments || []} onChange={(v) => onPatch({ notification: { ...n, attachments: v } })} searchable clearable />
            </>
          )}
          {actionId ? (
            <>
              <TranslationInput
                actionId={actionId}
                translationKey={`block_${blockIndex}.job_${jobIndex}.notification.subject`}
                label="Subject"
                placeholder="Enter email subject"
                required
              />
              <TranslationInput
                actionId={actionId}
                translationKey={`block_${blockIndex}.job_${jobIndex}.notification.body`}
                label="Body"
                placeholder="Enter email body"
                multiline
                minRows={4}
                required
              />
            </>
          ) : (
            <>
              <LocalizableInput
                label="Subject"
                placeholder="Enter email subject"
                value={localTranslations[`block_${blockIndex}.job_${jobIndex}.notification.subject`] || {}}
                onChange={(translations) => setLocalTranslations(prev => ({
                  ...prev,
                  [`block_${blockIndex}.job_${jobIndex}.notification.subject`]: translations
                }))}
                required
              />
              <LocalizableInput
                label="Body"
                placeholder="Enter email body"
                value={localTranslations[`block_${blockIndex}.job_${jobIndex}.notification.body`] || {}}
                onChange={(translations) => setLocalTranslations(prev => ({
                  ...prev,
                  [`block_${blockIndex}.job_${jobIndex}.notification.body`]: translations
                }))}
                multiline
                minRows={4}
                required
              />
            </>
          )}
        </Stack>
      </Card>
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
                    <TextInput label="Block name" value={block.block_name || ''} onChange={(e) => setBlock(bIndex, { block_name: e.currentTarget.value })} />
                    <ConditionBuilderField fieldId={1000 + bIndex} fieldName={`blocks.${bIndex}.condition`} value={block.condition || ''} onChange={(v) => setBlock(bIndex, { condition: v })} />

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
                                <TextInput label="Job name" value={job.job_name || ''} onChange={(e) => setJob(bIndex, jIndex, { job_name: e.currentTarget.value })} />
                                <Group grow>
                                  <Select label="Job type" data={[
                                    { value: 'add_group', label: 'Add group' },
                                    { value: 'remove_group', label: 'Remove group' },
                                    { value: 'notification', label: 'Schedule notification' },
                                    { value: 'notification_with_reminder', label: 'Schedule notification with reminders' },
                                    { value: 'notification_with_reminder_for_diary', label: 'Schedule notification with reminders for a diary' },
                                  ]} value={job.job_type || null} onChange={(v) => setJob(bIndex, jIndex, { job_type: v || undefined })} />
                                  {['notification_with_reminder', 'notification_with_reminder_for_diary'].includes(job.job_type) && (
                                    <Select label="Reminder for" data={formOptions} value={job.reminder_form_id || null} onChange={(v) => setJob(bIndex, jIndex, { reminder_form_id: v || undefined })} placeholder="Select data table" />
                                  )}
                                </Group>

                                {/* Schedule time */}
                                {renderScheduleTime(job, (patch) => setJob(bIndex, jIndex, patch))}

                                {/* Group add/remove */}
                                {['add_group', 'remove_group'].includes(job.job_type) && (
                                  <MultiSelect label="Group" data={groupsOptions} value={job.job_add_remove_groups || []} onChange={(v) => setJob(bIndex, jIndex, { job_add_remove_groups: v })} searchable />
                                )}

                                {/* Notification */}
                                {['notification', 'notification_with_reminder', 'notification_with_reminder_for_diary'].includes(job.job_type) && (
                                  renderNotification(job, (patch) => setJob(bIndex, jIndex, patch), bIndex, jIndex)
                                )}

                                {/* On execute condition */}
                                <ConditionBuilderField fieldId={2000 + bIndex * 100 + jIndex} fieldName={`blocks.${bIndex}.jobs.${jIndex}.on_job_execute.condition`} value={job.on_job_execute?.condition || ''} onChange={(v) => setJob(bIndex, jIndex, { on_job_execute: { ...(job.on_job_execute || {}), condition: v } })} />
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


