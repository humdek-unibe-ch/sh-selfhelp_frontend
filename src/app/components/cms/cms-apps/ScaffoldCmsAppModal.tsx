/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Scaffold the pages of an existing CMS app (uses the app id): one CMS list that holds the
 * form and manages the records, and a public read-only list with a detail page.
 */

import { useMemo, useState } from 'react';
import {
    Stack,
    TextInput,
    Select,
    Switch,
    MultiSelect,
    Group,
    Text,
    Table,
    Badge,
    Alert,
    Code,
    Button,
    Paper,
    ActionIcon,
    Tooltip,
    Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconInfoCircle, IconPlus, IconTrash, IconWand } from '@tabler/icons-react';
import { ModalWrapper } from '../../shared/common/CustomModal/CustomModal';
import { adminTableClasses as tableStyles } from '../shared/admin-table';
import { useDataTables } from '../../../../hooks/useData';
import { useAllGroups } from '../../../../hooks/useGroups';
import { useScaffoldCmsAppMutation } from '../../../../hooks/useCmsApps';
import {
    type ICmsAppFormField,
    type IScaffoldCmsAppRequest,
    type TCmsAppFormFieldStyle,
} from '../../../../types/requests/admin/cms-app.types';
import { plannedScaffoldRoutes, scaffoldFormNeedsCmsList } from './cmsAppPages.utils';

const FORM_FIELD_STYLE_OPTIONS: Array<{ value: TCmsAppFormFieldStyle; label: string }> = [
    { value: 'text-input', label: 'Text' },
    { value: 'textarea', label: 'Text area' },
    { value: 'select', label: 'Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio' },
    { value: 'number-input', label: 'Number' },
    { value: 'image', label: 'Image' },
    { value: 'files', label: 'Files (downloads)' },
];

interface IScaffoldCmsAppModalProps {
    opened: boolean;
    onClose: () => void;
    appId: number;
    defaultBaseName: string;
}

interface IWizardFormValues {
    base_name: string;
    create_form: boolean;
    form_fields: ICmsAppFormField[];
    with_status: boolean;
    data_table: string;
    create_public: boolean;
    create_admin: boolean;
    record_id_param: string;
    list_title: string;
    detail_title: string;
    access_groups: string[];
}

export function ScaffoldCmsAppModal({
    opened,
    onClose,
    appId,
    defaultBaseName,
}: IScaffoldCmsAppModalProps) {
    const [done, setDone] = useState(false);
    const { data: dataTablesData, isLoading: tablesLoading } = useDataTables();
    const tableOptions = (dataTablesData?.dataTables ?? []).map((table) => ({
        value: table.name,
        label: table.displayName || table.name,
    }));

    const { data: groupsData } = useAllGroups();
    const groupOptions = (groupsData?.groups ?? [])
        .map((group) => ({ value: String(group.id), label: group.name }));

    const form = useForm<IWizardFormValues>({
        initialValues: {
            base_name: defaultBaseName,
            create_form: true,
            form_fields: [{ name: 'title', style: 'text-input', label: '' }],
            with_status: true,
            data_table: '',
            create_public: true,
            create_admin: true,
            record_id_param: 'record_id',
            list_title: '',
            detail_title: '',
            access_groups: [],
        },
        validate: {
            base_name: (value) => {
                if (!value?.trim()) return 'Base name is required';
                if (!/^[a-z0-9-]+$/.test(value)) return 'Use lowercase letters, numbers and hyphens only';
                return null;
            },
            data_table: (value, values) => (values.create_form ? null : value ? null : 'Select a data table'),
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

    const scaffoldMutation = useScaffoldCmsAppMutation(appId);

    const plannedRoutes = useMemo(
        () =>
            plannedScaffoldRoutes({
                base: form.values.base_name,
                recordIdParam: form.values.record_id_param,
                createForm: form.values.create_form,
                createPublic: form.values.create_public,
                createAdmin: form.values.create_admin,
            }),
        [form.values],
    );

    const noSurfaceSelected = !form.values.create_public && !form.values.create_admin;
    const formNeedsCmsList = scaffoldFormNeedsCmsList({
        createForm: form.values.create_form,
        createAdmin: form.values.create_admin,
    });

    const handleClose = () => {
        form.reset();
        setDone(false);
        scaffoldMutation.reset();
        onClose();
    };

    const handleGenerate = () => {
        if (noSurfaceSelected || formNeedsCmsList) return;
        if (form.validate().hasErrors) return;

        const values = form.values;
        const payload: IScaffoldCmsAppRequest = {
            base_name: values.base_name.trim(),
            create_form: values.create_form,
            create_public: values.create_public,
            create_admin: values.create_admin,
            record_id_param: values.record_id_param,
            access_groups: values.access_groups.map(Number),
        };
        payload.with_status = values.with_status;
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

        scaffoldMutation.mutate(payload, { onSuccess: () => setDone(true) });
    };

    return (
        <ModalWrapper
            opened={opened}
            onClose={handleClose}
            title="Scaffold the pages of this app"
            size="xl"
            onSave={done ? undefined : handleGenerate}
            saveLabel={done ? 'Done' : 'Generate pages'}
            onCancel={handleClose}
            cancelLabel={done ? 'Close' : 'Cancel'}
            isLoading={scaffoldMutation.isPending}
            disabled={done ? false : noSurfaceSelected || formNeedsCmsList}
        >
            {done ? (
                <Alert color="green" icon={<IconInfoCircle size="1rem" />} title="Pages scaffolded">
                    Pages were assigned to this CMS app with strict roles. Use Manage content to open the
                    CMS list, where records are added, edited and deleted.
                </Alert>
            ) : (
                <Stack gap="md">
                    <Alert color="blue" icon={<IconInfoCircle size="1rem" />}>
                        Scaffolds pages into this CMS app (id {appId}). Editors manage the records in one CMS
                        list at <Code>/cms/&lt;base&gt;</Code> (it holds the form: add, edit, delete, restore),
                        not in Host Admin. Visitors read the same records in a read-only public list with a
                        detail page.
                    </Alert>

                    <TextInput
                        label="Base name"
                        withAsterisk
                        {...form.getInputProps('base_name')}
                    />

                    <Switch
                        label="Create a new form + data table"
                        description="The form is defined once, inside the CMS list, and owns the data table. Without it the CMS list only shows and deletes the records of an existing table."
                        checked={form.values.create_form}
                        onChange={(event) => form.setFieldValue('create_form', event.currentTarget.checked)}
                    />

                    <Switch
                        label="Draft / published status"
                        description="Adds a status field (default draft), publish and unpublish actions on the CMS list, and shows only published records on the public list and detail."
                        checked={form.values.with_status}
                        onChange={(event) => form.setFieldValue('with_status', event.currentTarget.checked)}
                    />

                    {form.values.create_form ? (
                        <Stack gap="xs">
                            <Group justify="space-between">
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
                            <Paper withBorder p="xs">
                                <Stack gap="xs">
                                    {form.values.form_fields.map((_field, index) => (
                                        <Group key={index} gap="xs" align="flex-start" wrap="nowrap">
                                            <TextInput
                                                placeholder="field_name"
                                                style={{ flex: 1 }}
                                                {...form.getInputProps(`form_fields.${index}.name`)}
                                            />
                                            <Select
                                                data={FORM_FIELD_STYLE_OPTIONS}
                                                w={130}
                                                allowDeselect={false}
                                                {...form.getInputProps(`form_fields.${index}.style`)}
                                            />
                                            <TextInput
                                                placeholder="Label"
                                                style={{ flex: 1 }}
                                                {...form.getInputProps(`form_fields.${index}.label`)}
                                            />
                                            <Tooltip label="Remove field">
                                                <ActionIcon aria-label="Remove field"
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
                            data={tableOptions}
                            searchable
                            withAsterisk
                            placeholder={tablesLoading ? 'Loading...' : 'Select a data table'}
                            {...form.getInputProps('data_table')}
                        />
                    )}

                    <Group grow>
                        <TextInput label="Detail route parameter" {...form.getInputProps('record_id_param')} />
                        <MultiSelect
                            label="Additional access groups"
                            data={groupOptions}
                            searchable
                            clearable
                            value={form.values.access_groups}
                            onChange={(value) => form.setFieldValue('access_groups', value)}
                        />
                    </Group>

                    <Group grow>
                        <TextInput label="List heading" {...form.getInputProps('list_title')} />
                        <TextInput label="Detail heading" {...form.getInputProps('detail_title')} />
                    </Group>

                    <Group gap="xl">
                        <Switch
                            label="Create the public list and detail pages"
                            checked={form.values.create_public}
                            onChange={(event) =>
                                form.setFieldValue('create_public', event.currentTarget.checked)
                            }
                        />
                        <Switch
                            label="Create the CMS list (manage records)"
                            checked={form.values.create_admin}
                            onChange={(event) =>
                                form.setFieldValue('create_admin', event.currentTarget.checked)
                            }
                        />
                    </Group>

                    {noSurfaceSelected && (
                        <Alert color="red" variant="light">
                            Select at least one of the public pages / the CMS list.
                        </Alert>
                    )}

                    {formNeedsCmsList && (
                        <Alert color="red" variant="light">
                            A new form lives inside the CMS list. Turn on the CMS list or turn off the new form.
                        </Alert>
                    )}

                    {plannedRoutes.length > 0 && (
                        <>
                            <Divider label="Pages that will be created" labelPosition="center" />
                            <Table withTableBorder withColumnBorders>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th className={tableStyles.tableHeader}>Role</Table.Th>
                                        <Table.Th className={tableStyles.tableHeader}>Surface</Table.Th>
                                        <Table.Th className={tableStyles.tableHeader}>Route</Table.Th>
                                        <Table.Th className={tableStyles.tableHeader}>What it does</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {plannedRoutes.map((route) => (
                                        <Table.Tr key={route.role}>
                                            <Table.Td className={tableStyles.tableCell}><Code>{route.role}</Code></Table.Td>
                                            <Table.Td className={tableStyles.tableCell}>
                                                <Badge
                                                    color={route.surface === 'cms' ? 'grape' : 'blue'}
                                                    variant="light"
                                                >
                                                    {route.surface}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td className={tableStyles.tableCell}><Code>{route.pattern}</Code></Table.Td>
                                            <Table.Td className={tableStyles.tableCell}>{route.description}</Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </>
                    )}

                    <Group gap={6} c="dimmed">
                        <IconWand size="1rem" />
                        <Text size="xs">Uses POST /admin/cms-apps/{'{id}'}/scaffold</Text>
                    </Group>
                </Stack>
            )}
        </ModalWrapper>
    );
}
