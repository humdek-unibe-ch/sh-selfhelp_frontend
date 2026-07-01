/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * CMS-in-CMS "Create list + detail pages" wizard (issue #30, Phase 6).
 *
 * Scaffolds a working CMS app in one step. By default it also creates the
 * **create form + its own data table** from the base name (no pre-existing
 * table needed): an admin form page (`/cms/<base>/form`) whose `form-log`
 * section OWNS a fresh data table, and the list/detail/delete pages all bind to
 * that table automatically. Advanced users can instead bind to an existing data
 * table.
 *
 * It previews the exact URLs/routes, then calls the backend orchestrator which
 * creates the pages, DB-driven routes, the data table, and the
 * entry-list/entry-record holders atomically. After creation it offers quick
 * links to open the generated public list and a detail page for a test record.
 */

import { useMemo, useState } from 'react';
import {
    Stack,
    TextInput,
    Select,
    Switch,
    MultiSelect,
    Button,
    Group,
    Text,
    Table,
    Badge,
    Alert,
    Anchor,
    Divider,
    Code,
    ActionIcon,
    Tooltip,
    Paper,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
    IconWand,
    IconInfoCircle,
    IconExternalLink,
    IconCheck,
    IconPlus,
    IconTrash,
} from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { useDataTables } from '../../../../../hooks/useData';
import { useGroups } from '../../../../../hooks/useGroups';
import { useCreateCmsAppMutation } from '../../../../../hooks/mutations/useCreateCmsAppMutation';
import {
    type ICreateCmsAppRequest,
    type ICreateCmsAppResult,
    type ICmsAppFormField,
    type TCmsAppFormFieldStyle,
} from '../../../../../types/requests/admin/cms-app-wizard.types';

/** Field-style choices for the builder (mirrors the backend enum). */
const FORM_FIELD_STYLE_OPTIONS: Array<{ value: TCmsAppFormFieldStyle; label: string }> = [
    { value: 'text-input', label: 'Text' },
    { value: 'textarea', label: 'Text area' },
    { value: 'select', label: 'Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio' },
    { value: 'number-input', label: 'Number' },
];

interface ICmsAppWizardModalProps {
    opened: boolean;
    onClose: () => void;
}

interface IWizardFormValues {
    base_name: string;
    create_form: boolean;
    form_fields: ICmsAppFormField[];
    data_table: string;
    create_public: boolean;
    create_admin: boolean;
    record_id_param: string;
    list_title: string;
    detail_title: string;
    access_groups: string[];
    test_record_id: string;
}

interface IPlannedRoute {
    role: string;
    surface: 'public' | 'cms';
    url: string;
    pattern: string;
}

export function CmsAppWizardModal({ opened, onClose }: ICmsAppWizardModalProps) {
    const [result, setResult] = useState<ICreateCmsAppResult | null>(null);

    const { data: dataTablesData, isLoading: tablesLoading } = useDataTables();
    const tableOptions = (dataTablesData?.dataTables ?? []).map((table) => ({
        value: table.name,
        label: table.displayName || table.name,
    }));

    const { data: groupsData } = useGroups({ pageSize: 200, sort: 'name', sortDirection: 'asc' });
    const groupOptions = (groupsData?.groups ?? []).map((group) => ({
        value: String(group.id),
        label: group.name,
    }));

    const form = useForm<IWizardFormValues>({
        initialValues: {
            base_name: '',
            create_form: true,
            form_fields: [{ name: 'title', style: 'text-input', label: '' }],
            data_table: '',
            create_public: true,
            create_admin: true,
            record_id_param: 'record_id',
            list_title: '',
            detail_title: '',
            access_groups: [],
            test_record_id: '1',
        },
        validate: {
            base_name: (value) => {
                if (!value?.trim()) return 'Base name is required';
                if (!/^[a-z0-9-]+$/.test(value)) return 'Use lowercase letters, numbers and hyphens only';
                return null;
            },
            // The table is only required when binding to an existing one; with the
            // default "create form" flow the wizard makes the table itself.
            data_table: (value, values) =>
                values.create_form ? null : value ? null : 'Select a data table',
            // Per-row field name validation (only when creating a form).
            form_fields: {
                name: (value, values) =>
                    !values.create_form || /^[a-z][a-z0-9_]*$/.test(value ?? '')
                        ? null
                        : 'snake_case only',
            },
            record_id_param: (value) =>
                /^[a-z][a-z0-9_]*$/.test(value) ? null : 'Use a snake_case identifier',
        },
    });

    const createCmsAppMutation = useCreateCmsAppMutation({
        onSuccess: (data) => {
            setResult(data);
        },
    });

    const { base_name, record_id_param, create_public, create_admin, create_form } = form.values;

    // Live preview of the pages/routes that will be generated.
    const plannedRoutes = useMemo<IPlannedRoute[]>(() => {
        const base = base_name.trim();
        if (!base) return [];
        const param = record_id_param || 'record_id';
        const routes: IPlannedRoute[] = [];
        if (create_form) {
            routes.push({ role: 'Create form', surface: 'cms', url: `/cms/${base}/form`, pattern: `/cms/${base}/form` });
        }
        if (create_public) {
            routes.push({ role: 'Public list', surface: 'public', url: `/${base}`, pattern: `/${base}` });
            routes.push({ role: 'Public detail', surface: 'public', url: `/${base}/123`, pattern: `/${base}/{${param}}` });
        }
        if (create_admin) {
            routes.push({ role: 'Admin list', surface: 'cms', url: `/cms/${base}`, pattern: `/cms/${base}` });
            routes.push({ role: 'Admin detail', surface: 'cms', url: `/cms/${base}/123`, pattern: `/cms/${base}/{${param}}` });
        }
        return routes;
    }, [base_name, record_id_param, create_public, create_admin, create_form]);

    const noSurfaceSelected = !create_public && !create_admin;

    const handleClose = () => {
        form.reset();
        setResult(null);
        createCmsAppMutation.reset();
        onClose();
    };

    const handleGenerate = () => {
        if (noSurfaceSelected) {
            return;
        }
        const validation = form.validate();
        if (validation.hasErrors) {
            return;
        }

        const values = form.values;
        const payload: ICreateCmsAppRequest = {
            base_name: values.base_name.trim(),
            create_form: values.create_form,
            create_public: values.create_public,
            create_admin: values.create_admin,
            record_id_param: values.record_id_param,
            access_groups: values.access_groups.map(Number),
        };
        if (values.create_form) {
            payload.form_fields = values.form_fields
                .map((field) => ({
                    name: field.name.trim(),
                    style: field.style,
                    ...(field.label?.trim() ? { label: field.label.trim() } : {}),
                }))
                .filter((field) => field.name.length > 0);
        } else {
            payload.data_table = values.data_table;
        }
        if (values.list_title.trim()) payload.list_title = values.list_title.trim();
        if (values.detail_title.trim()) payload.detail_title = values.detail_title.trim();

        createCmsAppMutation.mutate(payload);
    };

    const testRecordId = form.values.test_record_id.trim() || '1';

    return (
        <ModalWrapper
            opened={opened}
            onClose={handleClose}
            title="Create list + detail pages"
            size="xl"
            onSave={result ? undefined : handleGenerate}
            saveLabel="Generate pages"
            onCancel={handleClose}
            cancelLabel={result ? 'Done' : 'Cancel'}
            isLoading={createCmsAppMutation.isPending}
            disabled={noSurfaceSelected}
            customActions={
                result ? undefined : (
                    <Group gap={6} c="dimmed" mr="auto">
                        <IconWand size="1rem" />
                        <Text size="xs">
                            {create_form ? 'Creates the form, its data table, and the pages' : 'Binds to an existing table'}
                        </Text>
                    </Group>
                )
            }
        >
            {result ? (
                <Stack gap="md">
                    <Alert color="green" icon={<IconCheck size="1rem" />} title="Pages created">
                        Created {result.created.length} page(s). They are ordinary CMS pages and are fully
                        editable from the pages list.
                    </Alert>

                    <Table withTableBorder withColumnBorders>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Role</Table.Th>
                                <Table.Th>Keyword</Table.Th>
                                <Table.Th>Surface</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {result.created.map((page) => (
                                <Table.Tr key={page.page_id}>
                                    <Table.Td>{page.role}</Table.Td>
                                    <Table.Td><Code>{page.keyword}</Code></Table.Td>
                                    <Table.Td>
                                        <Badge color={page.surface === 'cms' ? 'grape' : 'blue'} variant="light">
                                            {page.surface}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    {form.values.create_public && (
                        <>
                            <Divider label="Preview public pages" labelPosition="center" />
                            <Group gap="md">
                                <Anchor href={`/${form.values.base_name.trim()}`} target="_blank" size="sm">
                                    <Group gap={4}>
                                        <IconExternalLink size="0.9rem" />
                                        Open list ({`/${form.values.base_name.trim()}`})
                                    </Group>
                                </Anchor>
                                <Anchor
                                    href={`/${form.values.base_name.trim()}/${testRecordId}`}
                                    target="_blank"
                                    size="sm"
                                >
                                    <Group gap={4}>
                                        <IconExternalLink size="0.9rem" />
                                        Open detail ({`/${form.values.base_name.trim()}/${testRecordId}`})
                                    </Group>
                                </Anchor>
                            </Group>
                            <TextInput
                                label="Test record id"
                                description="Used only to build the preview detail link above."
                                value={form.values.test_record_id}
                                onChange={(event) =>
                                    form.setFieldValue('test_record_id', event.currentTarget.value)
                                }
                                w={180}
                            />
                        </>
                    )}
                </Stack>
            ) : (
                <Stack gap="md">
                    <Alert color="blue" icon={<IconInfoCircle size="1rem" />}>
                        This scaffolds a working <strong>list + detail</strong> CMS app. The list links each
                        row to its detail page; the detail page filters the table on{' '}
                        <Code>{form.values.record_id_param || 'record_id'}{' = {{route.'}{form.values.record_id_param || 'record_id'}{'}}'}</Code>.
                    </Alert>

                    <TextInput
                        label="Base name"
                        description="Lowercase keyword base for pages, URLs and (by default) the new data table."
                        placeholder="team-members"
                        withAsterisk
                        {...form.getInputProps('base_name')}
                    />

                    <Divider label="Data source" labelPosition="center" />

                    <Switch
                        label="Create a new form + data table"
                        description="Recommended. Builds an admin form at /cms/<base>/form that owns a fresh data table, and binds the list/detail/delete to it. No existing table needed."
                        checked={form.values.create_form}
                        onChange={(event) => form.setFieldValue('create_form', event.currentTarget.checked)}
                    />

                    {form.values.create_form ? (
                        <Stack gap="xs">
                            <Group justify="space-between" align="center">
                                <Text size="sm" fw={500}>Form fields</Text>
                                <Button
                                    size="compact-xs"
                                    variant="light"
                                    leftSection={<IconPlus size="0.8rem" />}
                                    onClick={() =>
                                        form.insertListItem('form_fields', {
                                            name: '',
                                            style: 'text-input',
                                            label: '',
                                        })
                                    }
                                >
                                    Add field
                                </Button>
                            </Group>
                            <Text size="xs" c="dimmed">
                                Each field becomes an input in the new form and a column in its data table.
                                The list/detail pages show every field as an editable interpolation line.
                            </Text>
                            <Paper withBorder p="xs">
                                <Stack gap="xs">
                                    {form.values.form_fields.map((field, index) => (
                                        <Group key={index} gap="xs" align="flex-start" wrap="nowrap">
                                            <TextInput
                                                placeholder="field_name"
                                                aria-label={`Field ${index + 1} name`}
                                                style={{ flex: 1 }}
                                                {...form.getInputProps(`form_fields.${index}.name`)}
                                            />
                                            <Select
                                                data={FORM_FIELD_STYLE_OPTIONS}
                                                aria-label={`Field ${index + 1} style`}
                                                w={130}
                                                allowDeselect={false}
                                                {...form.getInputProps(`form_fields.${index}.style`)}
                                            />
                                            <TextInput
                                                placeholder="Label (optional)"
                                                aria-label={`Field ${index + 1} label`}
                                                style={{ flex: 1 }}
                                                {...form.getInputProps(`form_fields.${index}.label`)}
                                            />
                                            <Tooltip
                                                label={
                                                    form.values.form_fields.length <= 1
                                                        ? 'At least one field is required'
                                                        : 'Remove field'
                                                }
                                            >
                                                <ActionIcon
                                                    color="red"
                                                    variant="subtle"
                                                    mt={4}
                                                    disabled={form.values.form_fields.length <= 1}
                                                    onClick={() => form.removeListItem('form_fields', index)}
                                                >
                                                    <IconTrash size="0.9rem" />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    ))}
                                </Stack>
                            </Paper>
                        </Stack>
                    ) : (
                        <Select
                            label="Existing data table"
                            description="Bind the generated pages to a table that already exists."
                            placeholder={tablesLoading ? 'Loading...' : 'Select a data table'}
                            data={tableOptions}
                            searchable
                            withAsterisk
                            {...form.getInputProps('data_table')}
                        />
                    )}

                    <Divider label="Pages & access" labelPosition="center" />

                    <Group grow align="flex-start">
                        <TextInput
                            label="Detail route parameter"
                            description="snake_case name for the record id in the URL."
                            {...form.getInputProps('record_id_param')}
                        />
                        <MultiSelect
                            label="Additional access groups"
                            description="Optional groups granted access (on top of surface defaults)."
                            placeholder="Select groups"
                            data={groupOptions}
                            searchable
                            clearable
                            value={form.values.access_groups}
                            onChange={(value) => form.setFieldValue('access_groups', value)}
                        />
                    </Group>

                    <Group grow align="flex-start">
                        <TextInput
                            label="List heading (optional)"
                            placeholder="Defaults to the base name"
                            {...form.getInputProps('list_title')}
                        />
                        <TextInput
                            label="Detail heading (optional)"
                            placeholder="Defaults to '<list> detail'"
                            {...form.getInputProps('detail_title')}
                        />
                    </Group>

                    <Group gap="xl">
                        <Switch
                            label="Create public pages"
                            description="/<base> and /<base>/{record_id}"
                            checked={form.values.create_public}
                            onChange={(event) =>
                                form.setFieldValue('create_public', event.currentTarget.checked)
                            }
                        />
                        <Switch
                            label="Create admin (CMS) pages"
                            description="/cms/<base> and /cms/<base>/{record_id}"
                            checked={form.values.create_admin}
                            onChange={(event) =>
                                form.setFieldValue('create_admin', event.currentTarget.checked)
                            }
                        />
                    </Group>

                    {noSurfaceSelected && (
                        <Alert color="red" variant="light">
                            Select at least one of public / admin pages to create.
                        </Alert>
                    )}

                    {plannedRoutes.length > 0 && (
                        <>
                            <Divider label="Pages that will be created" labelPosition="center" />
                            <Table withTableBorder withColumnBorders>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Role</Table.Th>
                                        <Table.Th>Surface</Table.Th>
                                        <Table.Th>Route pattern</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {plannedRoutes.map((route) => (
                                        <Table.Tr key={route.role}>
                                            <Table.Td>{route.role}</Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    color={route.surface === 'cms' ? 'grape' : 'blue'}
                                                    variant="light"
                                                >
                                                    {route.surface}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td><Code>{route.pattern}</Code></Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </>
                    )}
                </Stack>
            )}
        </ModalWrapper>
    );
}
