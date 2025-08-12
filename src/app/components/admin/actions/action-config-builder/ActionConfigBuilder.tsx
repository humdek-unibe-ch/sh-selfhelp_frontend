"use client";

import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Alert, Box, Button, Card, Divider, Group, MultiSelect, NumberInput, SegmentedControl, Select, Stack, Switch, Tabs, Text, TextInput, Textarea } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { ACTION_SCHEDULE_TYPES, TIME_PERIOD, WEEKDAYS } from '../../../../../constants/lookups.constants';
import { AdminGroupApi } from '../../../../../api/admin/group.api';
import { AdminDataApi } from '../../../../../api/admin/data.api';
import { AdminAssetApi } from '../../../../../api/admin/asset.api';
import { ConditionBuilderField } from '../../shared/field-components/ConditionBuilderField';
import dynamic from 'next/dynamic';

const MonacoFieldEditor = dynamic(() => import('../../shared/monaco-field-editor/MonacoFieldEditor').then(m => m.MonacoFieldEditor), { ssr: false });

interface IActionConfigBuilderProps {
  value?: any;
  onChange: (cfg: any) => void;
}

function ensureArray<T>(arr: T[] | undefined): T[] { return Array.isArray(arr) ? arr : []; }

export function ActionConfigBuilder({ value, onChange }: IActionConfigBuilderProps) {
  const [config, setConfig] = useState<any>(value || { blocks: [] });
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

  useEffect(() => { onChange(config); }, [config, onChange]);

  const scheduleTypeData = useMemo(() => scheduleTypes.map(l => ({ value: l.lookupCode, label: l.lookupValue })), [scheduleTypes]);
  const timePeriodData = useMemo(() => timePeriod.map(l => ({ value: l.lookupCode, label: l.lookupValue })), [timePeriod]);
  const weekdaysData = useMemo(() => weekdays.map(l => ({ value: l.lookupCode, label: l.lookupValue })), [weekdays]);

  const addBlock = () => setConfig((prev: any) => ({ ...prev, blocks: [...ensureArray(prev.blocks), { block_name: 'Block', jobs: [] }] }));
  const removeBlock = (index: number) => setConfig((prev: any) => ({ ...prev, blocks: ensureArray(prev.blocks).filter((_: any, i: number) => i !== index) }));
  const setBlock = (index: number, patch: any) => setConfig((prev: any) => ({ ...prev, blocks: ensureArray(prev.blocks).map((b: any, i: number) => i === index ? { ...b, ...patch } : b) }));

  const addJob = (bIndex: number) => setBlock(bIndex, { jobs: [...ensureArray(config.blocks?.[bIndex]?.jobs), { job_name: 'Job', job_type: 'notification', schedule_time: {} }] });
  const removeJob = (bIndex: number, jIndex: number) => setBlock(bIndex, { jobs: ensureArray(config.blocks?.[bIndex]?.jobs).filter((_: any, i: number) => i !== jIndex) });
  const setJob = (bIndex: number, jIndex: number, patch: any) => setBlock(bIndex, { jobs: ensureArray(config.blocks?.[bIndex]?.jobs).map((j: any, i: number) => i === jIndex ? { ...j, ...patch } : j) });

  const top = (
    <Card withBorder>
      <Stack gap="md">
        <ConditionBuilderField fieldId={1} fieldName="root.condition" value={config.condition || ''} onChange={(v) => setConfig((p: any) => ({ ...p, condition: v }))} />
        <Group>
          <Switch checked={!!config.randomize} onChange={(e) => setConfig({ ...config, randomize: e.currentTarget.checked })} label="Randomize" />
          <Switch checked={!!config.repeat} onChange={(e) => setConfig({ ...config, repeat: e.currentTarget.checked })} label="Repeat" />
          <Switch checked={!!config.repeat_until_date} onChange={(e) => setConfig({ ...config, repeat_until_date: e.currentTarget.checked })} label="Repeat until date" />
          <Switch checked={!!config.target_groups} onChange={(e) => setConfig({ ...config, target_groups: e.currentTarget.checked })} label="Target groups" />
          <Switch checked={!!config.overwrite_variables} onChange={(e) => setConfig({ ...config, overwrite_variables: e.currentTarget.checked })} label="Overwrite variables" />
        </Group>
        {config.randomize && (
          <Group grow>
            <Switch checked={!!(config.randomizer?.even_presentation)} onChange={(e) => setConfig({ ...config, randomizer: { ...(config.randomizer||{}), even_presentation: e.currentTarget.checked } })} label="Evenly present blocks" />
            <NumberInput label="Randomly present" min={1} value={config.randomizer?.random_elements ?? 1} onChange={(v) => setConfig({ ...config, randomizer: { ...(config.randomizer||{}), random_elements: Number(v)||1 } })} />
          </Group>
        )}
        <Group>
          <Switch checked={!!config.clear_existing_jobs_for_action} onChange={(e) => setConfig({ ...config, clear_existing_jobs_for_action: e.currentTarget.checked })} label="Clear Scheduled Jobs for This Action" />
          <Switch checked={!!config.clear_existing_jobs_for_record_and_action} onChange={(e) => setConfig({ ...config, clear_existing_jobs_for_record_and_action: e.currentTarget.checked })} label="Clear Scheduled Jobs for This Action & Record" />
        </Group>
        {config.repeat && (
          <Group grow>
            <NumberInput label="Occurrences" min={1} value={config.repeater?.occurrences ?? 1} onChange={(v) => setConfig({ ...config, repeater: { ...(config.repeater||{}), occurrences: Number(v)||1 } })} />
            <Select label="Repeat every" data={[{value:'day',label:'Day'},{value:'week',label:'Week'},{value:'month',label:'Month'}]} value={config.repeater?.frequency || null} onChange={(v)=> setConfig({ ...config, repeater: { ...(config.repeater||{}), frequency: v||undefined } })} />
          </Group>
        )}
        {config.repeat_until_date && (
          <Stack gap="xs">
            <TextInput label="Until deadline" placeholder="YYYY-MM-DD HH:mm" value={config.repeater_until_date?.deadline || ''} onChange={(e)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), deadline: e.currentTarget.value } })} />
            <Group grow>
              <TextInput label="Schedule at" placeholder="HH:mm" value={config.repeater_until_date?.schedule_at || ''} onChange={(e)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), schedule_at: e.currentTarget.value } })} />
              <NumberInput label="Repeat" min={1} max={30} value={config.repeater_until_date?.repeat_every ?? 1} onChange={(v)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), repeat_every: Number(v)||1 } })} />
              <Select label="Frequency" data={[{value:'day',label:'Day'},{value:'week',label:'Week'},{value:'month',label:'Month'}]} value={config.repeater_until_date?.frequency || null} onChange={(v)=> setConfig({ ...config, repeater_until_date: { ...(config.repeater_until_date||{}), frequency: v||undefined } })} />
            </Group>
          </Stack>
        )}
        {config.target_groups && (
          <MultiSelect label="Select target groups" data={groupsOptions} value={config.selected_target_groups || []} onChange={(v) => setConfig({ ...config, selected_target_groups: v })} searchable clearable />
        )}
        {config.overwrite_variables && (
          <MultiSelect label="Overwrite variables" data={[
            { value: 'send_after', label: 'send_after' },
            { value: 'send_after_type', label: 'send_after_type' },
            { value: 'send_on_day_at', label: 'send_on_day_at' },
            { value: 'custom_time', label: 'custom_time' },
            { value: 'impersonate_user_code', label: 'impersonate_user_code' },
          ]} value={config.selected_overwrite_variables || []} onChange={(v)=> setConfig({ ...config, selected_overwrite_variables: v })} searchable clearable />
        )}
      </Stack>
    </Card>
  );

  const renderScheduleTime = (job: any, onPatch: (patch: any) => void) => {
    const st = job.schedule_time || {};
    return (
      <Card withBorder>
        <Stack gap="xs">
          <Select label="Schedule type" data={scheduleTypeData} value={st.job_schedule_types || null} onChange={(v) => onPatch({ schedule_time: { ...st, job_schedule_types: v || undefined } })} searchable clearable />
          {st.job_schedule_types === 'after_period' && (
            <Group grow>
              <NumberInput label="Send after" min={1} value={st.send_after ?? 1} onChange={(v) => onPatch({ schedule_time: { ...st, send_after: Number(v) || 1 } })} />
              <Select label="Unit" data={timePeriodData} value={st.send_after_type || 'days'} onChange={(v) => onPatch({ schedule_time: { ...st, send_after_type: v || 'days' } })} />
              <TextInput label="at" placeholder="Enter time (HH:mm)" value={st.send_on_day_at || ''} onChange={(e) => onPatch({ schedule_time: { ...st, send_on_day_at: e.currentTarget.value } })} />
            </Group>
          )}
          {st.job_schedule_types === 'after_period_on_day_at_time' && (
            <Group grow>
              <Select label="Send on" data={[
                { value: 'this', label: 'This' },
                { value: 'next', label: 'Next' },
                { value: 'in_two', label: 'In two' },
                { value: 'in_three', label: 'In three' },
                { value: 'in_four', label: 'In four' },
              ]} value={st.send_on || null} onChange={(v) => onPatch({ schedule_time: { ...st, send_on: v || undefined } })} />
              <Select label="Week day" data={weekdaysData} value={st.send_on_day || null} onChange={(v) => onPatch({ schedule_time: { ...st, send_on_day: v || undefined } })} />
              <TextInput label="at" placeholder="Enter time (HH:mm)" value={st.send_on_day_at || ''} onChange={(e) => onPatch({ schedule_time: { ...st, send_on_day_at: e.currentTarget.value } })} />
            </Group>
          )}
          {st.job_schedule_types === 'on_fixed_datetime' && (
            <TextInput label="Select date" placeholder="YYYY-MM-DD HH:mm" value={st.custom_time || ''} onChange={(e) => onPatch({ schedule_time: { ...st, custom_time: e.currentTarget.value } })} />
          )}
        </Stack>
      </Card>
    );
  };

  const renderNotification = (job: any, onPatch: (patch: any) => void) => {
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
              <Group grow>
                <TextInput label="From email" value={n.from_email || ''} onChange={(e) => onPatch({ notification: { ...n, from_email: e.currentTarget.value } })} />
                <TextInput label="From name" value={n.from_name || ''} onChange={(e) => onPatch({ notification: { ...n, from_name: e.currentTarget.value } })} />
              </Group>
              <Group grow>
                <TextInput label="Reply to" value={n.reply_to || ''} onChange={(e) => onPatch({ notification: { ...n, reply_to: e.currentTarget.value } })} />
              </Group>
              <MultiSelect label="Attachments" data={assetOptions} value={n.attachments || []} onChange={(v) => onPatch({ notification: { ...n, attachments: v } })} searchable clearable />
            </>
          )}
          <TextInput label="Subject" value={n.subject || ''} onChange={(e) => onPatch({ notification: { ...n, subject: e.currentTarget.value } })} />
          <Textarea label="Body" minRows={4} value={n.body || ''} onChange={(e) => onPatch({ notification: { ...n, body: e.currentTarget.value } })} />
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

          <Group justify="space-between">
            <Text fw={600}>Blocks</Text>
            <Button leftSection={<IconPlus size={16} />} onClick={addBlock} variant="light">Add Block</Button>
          </Group>

          {blocks.map((block: any, bIndex: number) => (
            <Card key={bIndex} withBorder>
              <Group justify="space-between" mb="sm">
                <TextInput label="Block name" value={block.block_name || ''} onChange={(e) => setBlock(bIndex, { block_name: e.currentTarget.value })} style={{ flex: 1 }} />
                <ActionIcon color="red" variant="subtle" onClick={() => removeBlock(bIndex)}><IconTrash size={16} /></ActionIcon>
              </Group>

              <Stack gap="sm">
                <ConditionBuilderField fieldId={1000 + bIndex} fieldName={`blocks.${bIndex}.condition`} value={block.condition || ''} onChange={(v) => setBlock(bIndex, { condition: v })} />

                <Group justify="space-between" mt="md">
                  <Text fw={600}>Jobs</Text>
                  <Button leftSection={<IconPlus size={16} />} onClick={() => addJob(bIndex)} variant="light">Add Job</Button>
                </Group>

                {ensureArray(block.jobs).map((job: any, jIndex: number) => (
                  <Card key={jIndex} withBorder>
                    <Group justify="space-between" mb="xs">
                      <TextInput label="Job name" value={job.job_name || ''} onChange={(e) => setJob(bIndex, jIndex, { job_name: e.currentTarget.value })} style={{ flex: 1 }} />
                      <ActionIcon color="red" variant="subtle" onClick={() => removeJob(bIndex, jIndex)}><IconTrash size={16} /></ActionIcon>
                    </Group>

                    <Group grow>
                      <Select label="Job type" data={[
                        { value: 'add_group', label: 'Add group' },
                        { value: 'remove_group', label: 'Remove group' },
                        { value: 'notification', label: 'Schedule notification' },
                        { value: 'notification_with_reminder', label: 'Schedule notification with reminders' },
                        { value: 'notification_with_reminder_for_diary', label: 'Schedule notification with reminders for a diary' },
                      ]} value={job.job_type || null} onChange={(v) => setJob(bIndex, jIndex, { job_type: v || undefined })} />
                      <Select label="Reminder for" data={formOptions} value={job.reminder_form_id || null} onChange={(v) => setJob(bIndex, jIndex, { reminder_form_id: v || undefined })} placeholder="Select data table" />
                    </Group>

                    {/* Schedule time */}
                    {renderScheduleTime(job, (patch) => setJob(bIndex, jIndex, patch))}

                    {/* Group add/remove */}
                    {['add_group', 'remove_group'].includes(job.job_type) && (
                      <MultiSelect label="Group" data={groupsOptions} value={job.job_add_remove_groups || []} onChange={(v) => setJob(bIndex, jIndex, { job_add_remove_groups: v })} searchable />
                    )}

                    {/* Notification */}
                    {['notification', 'notification_with_reminder', 'notification_with_reminder_for_diary'].includes(job.job_type) && (
                      renderNotification(job, (patch) => setJob(bIndex, jIndex, patch))
                    )}

                    {/* On execute condition */}
                    <ConditionBuilderField fieldId={2000 + bIndex * 100 + jIndex} fieldName={`blocks.${bIndex}.jobs.${jIndex}.on_job_execute.condition`} value={job.on_job_execute?.condition || ''} onChange={(v) => setJob(bIndex, jIndex, { on_job_execute: { ...(job.on_job_execute || {}), condition: v } })} />
                  </Card>
                ))}
              </Stack>
            </Card>
          ))}
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


