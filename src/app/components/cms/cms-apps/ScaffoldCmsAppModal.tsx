/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Scaffold the pages of an existing CMS app (uses the app id): one CMS list that holds the
 * form and manages the records, and a public read-only list with a detail page.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
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
    ScrollArea,
    ThemeIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconAlignLeft,
    IconCheckbox,
    IconCircleDot,
    IconFiles,
    IconInfoCircle,
    IconLanguage,
    IconNumbers,
    IconPhoto,
    IconPlus,
    IconSelect,
    IconTextSize,
    IconTrash,
    IconWand,
} from '@tabler/icons-react';
import { ModalWrapper } from '../../shared/common/CustomModal/CustomModal';
import { adminTableClasses as tableStyles } from '../shared/admin-table';
import { useDataTables } from '../../../../hooks/useData';
import { useAllGroups } from '../../../../hooks/useGroups';
import { useScaffoldCmsAppMutation } from '../../../../hooks/useCmsApps';
import { usePublicLanguages } from '../../../../hooks/useLanguages';
import {
    type ICmsAppFormField,
    type IScaffoldCmsAppRequest,
    type TCmsAppFormFieldStyle,
} from '../../../../types/requests/admin/cms-app.types';
import { plannedScaffoldRoutes, scaffoldFormNeedsCmsList } from './cmsAppPages.utils';
import {
    formFieldNeedsSetup,
    isTranslatableFormFieldStyle,
    styleHelpText,
} from './scaffoldFormFieldMeta';

const FORM_FIELD_STYLE_OPTIONS: Array<{
    value: TCmsAppFormFieldStyle;
    label: string;
}> = [
    { value: 'text-input', label: 'Text' },
    { value: 'textarea', label: 'Text area' },
    { value: 'select', label: 'Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio' },
    { value: 'number-input', label: 'Number' },
    { value: 'image', label: 'Image' },
    { value: 'files', label: 'Files (downloads)' },
];

const STYLE_ICONS: Record<Exclude<TCmsAppFormFieldStyle, 'file-input'>, typeof IconTextSize> = {
    'text-input': IconTextSize,
    textarea: IconAlignLeft,
    select: IconSelect,
    checkbox: IconCheckbox,
    radio: IconCircleDot,
    'number-input': IconNumbers,
    image: IconPhoto,
    files: IconFiles,
};

const TRANSLATABLE_HELP =
    'Editors enter this value once per language; visitors see their language.';
const TRANSLATABLE_DISABLED_HINT = 'Only text and text area values can be translated';
const NEEDS_SETUP_HINT = 'Finish options, accepted file types or limits afterwards in the CMS list.';

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

function defaultTitleField(translatable: boolean): ICmsAppFormField {
    return {
        name: 'title',
        style: 'text-input',
        label: '',
        ...(translatable ? { translatable: true } : {}),
    };
}

function buildInitialValues(baseName: string, titleTranslatable: boolean): IWizardFormValues {
    return {
        base_name: baseName,
        create_form: true,
        form_fields: [defaultTitleField(titleTranslatable)],
        with_status: true,
        data_table: '',
        create_public: true,
        create_admin: true,
        record_id_param: 'record_id',
        list_title: '',
        detail_title: '',
        access_groups: [],
    };
}

function styleIcon(style: TCmsAppFormFieldStyle) {
    if (style === 'file-input') {
        return IconFiles;
    }
    return STYLE_ICONS[style];
}

function styleLabel(style: TCmsAppFormFieldStyle): string {
    return FORM_FIELD_STYLE_OPTIONS.find((option) => option.value === style)?.label ?? style;
}

export function ScaffoldCmsAppModal({
    opened,
    onClose,
    appId,
    defaultBaseName,
}: IScaffoldCmsAppModalProps) {
    const [done, setDone] = useState(false);
    const [needsSetupNames, setNeedsSetupNames] = useState<string[]>([]);
    const titleDefaultApplied = useRef(false);

    const { data: dataTablesData, isLoading: tablesLoading } = useDataTables();
    const tableOptions = (dataTablesData?.dataTables ?? []).map((table) => ({
        value: table.name,
        label: table.displayName || table.name,
    }));

    const { data: groupsData } = useAllGroups();
    const groupOptions = (groupsData?.groups ?? []).map((group) => ({
        value: String(group.id),
        label: group.name,
    }));

    const { languages, isLoading: languagesLoading } = usePublicLanguages();
    const hasMultipleLanguages = languages.length > 1;

    const form = useForm<IWizardFormValues>({
        initialValues: buildInitialValues(defaultBaseName, false),
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

    useEffect(() => {
        if (!opened) {
            titleDefaultApplied.current = false;
            return;
        }
        if (languagesLoading) return;
        if (titleDefaultApplied.current) return;

        form.setValues(buildInitialValues(defaultBaseName, hasMultipleLanguages));
        setDone(false);
        setNeedsSetupNames([]);
        titleDefaultApplied.current = true;
        // form.setValues is stable enough; avoid depending on the whole form object
        // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once per open once languages are known
    }, [opened, languagesLoading, hasMultipleLanguages, defaultBaseName]);

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
    const cmsListRoute = `/cms/${form.values.base_name.trim() || defaultBaseName}`;

    const handleClose = () => {
        form.setValues(buildInitialValues(defaultBaseName, hasMultipleLanguages));
        setDone(false);
        setNeedsSetupNames([]);
        titleDefaultApplied.current = false;
        scaffoldMutation.reset();
        onClose();
    };

    const updateFieldStyle = (index: number, style: TCmsAppFormFieldStyle) => {
        const current = form.values.form_fields[index];
        if (!current) return;
        const next: ICmsAppFormField = {
            ...current,
            style,
        };
        if (!isTranslatableFormFieldStyle(style)) {
            delete next.translatable;
        }
        form.setFieldValue(`form_fields.${index}`, next);
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

        let setupNames: string[] = [];
        if (values.create_form) {
            const fields = values.form_fields
                .map((field) => {
                    const trimmedName = field.name.trim();
                    const row: ICmsAppFormField = {
                        name: trimmedName,
                        style: field.style,
                        ...(field.label?.trim() ? { label: field.label.trim() } : {}),
                    };
                    if (field.translatable && isTranslatableFormFieldStyle(field.style)) {
                        row.translatable = true;
                    }
                    return row;
                })
                .filter((field) => field.name.length > 0);
            payload.form_fields = fields;
            setupNames = fields
                .filter((field) => formFieldNeedsSetup(field.style))
                .map((field) => field.name);
        } else {
            payload.data_table = values.data_table;
        }
        if (values.list_title.trim()) payload.list_title = values.list_title.trim();
        if (values.detail_title.trim()) payload.detail_title = values.detail_title.trim();

        scaffoldMutation.mutate(payload, {
            onSuccess: () => {
                setNeedsSetupNames(setupNames);
                setDone(true);
                if (setupNames.length > 0) {
                    notifications.show({
                        title: 'Finish field setup',
                        message: `Set up ${setupNames.join(', ')} on the CMS list at ${cmsListRoute} (options, accepted types or limits).`,
                        color: 'blue',
                        autoClose: 8000,
                        position: 'top-center',
                    });
                }
            },
        });
    };

    return (
        <ModalWrapper
            opened={opened}
            onClose={handleClose}
            title="Scaffold the pages of this app"
            size={1200}
            disableScroll
            cancelPosition="left"
            onSave={done ? undefined : handleGenerate}
            saveLabel={done ? 'Done' : 'Generate pages'}
            onCancel={handleClose}
            cancelLabel={done ? 'Close' : 'Cancel'}
            isLoading={scaffoldMutation.isPending}
            disabled={done ? false : noSurfaceSelected || formNeedsCmsList}
        >
            {done ? (
                <Stack gap="sm">
                    <Alert color="green" icon={<IconInfoCircle size="1rem" />} title="Pages scaffolded">
                        Pages were assigned to this CMS app with strict roles. Use Manage content to open the
                        CMS list at <Code>{cmsListRoute}</Code>, where records are added, edited and deleted.
                    </Alert>
                    {needsSetupNames.length > 0 && (
                        <Alert color="blue" icon={<IconInfoCircle size="1rem" />} title="Needs setup">
                            Finish {needsSetupNames.map((name) => (
                                <Code key={name} mr={4}>{name}</Code>
                            ))}
                            afterwards on that CMS list (options, accepted file types or limits).
                        </Alert>
                    )}
                </Stack>
            ) : (
                <Stack gap={8}>
                    <Alert color="blue" icon={<IconInfoCircle size="1rem" />} py={6}>
                        Scaffolds into this app (id {appId}). Editors use the CMS list at{' '}
                        <Code>/cms/&lt;base&gt;</Code>; visitors get a public list and detail.
                    </Alert>

                    <Group grow align="flex-start" gap="sm">
                        <TextInput
                            label="Base name"
                            withAsterisk
                            {...form.getInputProps('base_name')}
                        />
                        <TextInput
                            label="Detail route parameter"
                            {...form.getInputProps('record_id_param')}
                        />
                        <MultiSelect
                            label="Additional access groups"
                            data={groupOptions}
                            searchable
                            clearable
                            value={form.values.access_groups}
                            onChange={(value) => form.setFieldValue('access_groups', value)}
                        />
                    </Group>

                    <Group gap="md" wrap="wrap">
                        <Tooltip label="Form lives inside the CMS list and owns the data table.">
                            <Switch
                                size="sm"
                                label="Create a new form + data table"
                                checked={form.values.create_form}
                                onChange={(event) =>
                                    form.setFieldValue('create_form', event.currentTarget.checked)
                                }
                            />
                        </Tooltip>
                        <Tooltip label="Adds status, publish actions, and a public published filter.">
                            <Switch
                                size="sm"
                                label="Draft / published status"
                                checked={form.values.with_status}
                                onChange={(event) =>
                                    form.setFieldValue('with_status', event.currentTarget.checked)
                                }
                            />
                        </Tooltip>
                        <Switch
                            size="sm"
                            label="Create the public list and detail pages"
                            checked={form.values.create_public}
                            onChange={(event) =>
                                form.setFieldValue('create_public', event.currentTarget.checked)
                            }
                        />
                        <Switch
                            size="sm"
                            label="Create the CMS list (manage records)"
                            checked={form.values.create_admin}
                            onChange={(event) =>
                                form.setFieldValue('create_admin', event.currentTarget.checked)
                            }
                        />
                    </Group>

                    {form.values.create_form ? (
                        <Stack gap={6}>
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
                                The wizard creates these fields with sensible defaults. Fields marked{' '}
                                <Text span fw={500} inherit>
                                    Needs setup
                                </Text>{' '}
                                (options, accepted file types, limits) are finished afterwards in the CMS list
                                page&apos;s form.
                            </Text>
                            <Paper withBorder p="xs">
                                <ScrollArea.Autosize mah={168} type="auto" offsetScrollbars>
                                    <Stack gap="xs">
                                        {form.values.form_fields.map((field, index) => {
                                            const StyleIcon = styleIcon(field.style);
                                            const canTranslate = isTranslatableFormFieldStyle(field.style);
                                            const needsSetup = formFieldNeedsSetup(field.style);
                                            const typeName = styleLabel(field.style);

                                            return (
                                                <Group
                                                    key={index}
                                                    gap="xs"
                                                    align="flex-start"
                                                    wrap="nowrap"
                                                >
                                                    <TextInput
                                                        placeholder="field_name"
                                                        aria-label={`Field ${index + 1} name`}
                                                        style={{ flex: '1 1 140px', minWidth: 120 }}
                                                        {...form.getInputProps(`form_fields.${index}.name`)}
                                                    />
                                                    <Group gap={4} wrap="nowrap" align="center">
                                                        <Select
                                                            data={FORM_FIELD_STYLE_OPTIONS}
                                                            w={150}
                                                            allowDeselect={false}
                                                            aria-label={`Field ${index + 1} type`}
                                                            data-testid={`form-field-style-${index}`}
                                                            leftSection={<StyleIcon size={14} />}
                                                            value={field.style}
                                                            onChange={(value) => {
                                                                if (value) {
                                                                    updateFieldStyle(
                                                                        index,
                                                                        value as TCmsAppFormFieldStyle,
                                                                    );
                                                                }
                                                            }}
                                                            renderOption={({ option }) => {
                                                                const OptionIcon = styleIcon(
                                                                    option.value as TCmsAppFormFieldStyle,
                                                                );
                                                                return (
                                                                    <Group gap={8}>
                                                                        <OptionIcon size={14} aria-hidden />
                                                                        <span>{option.label}</span>
                                                                    </Group>
                                                                );
                                                            }}
                                                        />
                                                        <Tooltip
                                                            label={styleHelpText(field.style)}
                                                            multiline
                                                            w={260}
                                                            withArrow
                                                        >
                                                            <ActionIcon
                                                                variant="subtle"
                                                                size="sm"
                                                                color="gray"
                                                                aria-label={`About the ${typeName} field`}
                                                            >
                                                                <IconInfoCircle size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>
                                                    <TextInput
                                                        placeholder="Label shown to editors and visitors"
                                                        aria-label={`Field ${index + 1} label`}
                                                        style={{ flex: '1 1 160px', minWidth: 140 }}
                                                        {...form.getInputProps(`form_fields.${index}.label`)}
                                                    />
                                                    <Group gap={4} wrap="nowrap" align="center" mt={4}>
                                                        <Tooltip
                                                            label={
                                                                canTranslate
                                                                    ? TRANSLATABLE_HELP
                                                                    : TRANSLATABLE_DISABLED_HINT
                                                            }
                                                            multiline
                                                            w={240}
                                                            withArrow
                                                        >
                                                            <Switch
                                                                size="sm"
                                                                checked={Boolean(field.translatable)}
                                                                disabled={!canTranslate}
                                                                aria-label="Translatable"
                                                                label={
                                                                    <Group gap={4} wrap="nowrap">
                                                                        <IconLanguage size={14} />
                                                                        <Text size="xs">Translatable</Text>
                                                                    </Group>
                                                                }
                                                                onChange={(event) => {
                                                                    const on = event.currentTarget.checked;
                                                                    const next: ICmsAppFormField = {
                                                                        ...form.values.form_fields[index],
                                                                    };
                                                                    if (on && canTranslate) {
                                                                        next.translatable = true;
                                                                    } else {
                                                                        delete next.translatable;
                                                                    }
                                                                    form.setFieldValue(
                                                                        `form_fields.${index}`,
                                                                        next,
                                                                    );
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip label={TRANSLATABLE_HELP} multiline w={240} withArrow>
                                                            <ActionIcon
                                                                variant="subtle"
                                                                size="sm"
                                                                color="gray"
                                                                aria-label="About translatable fields"
                                                            >
                                                                <IconInfoCircle size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>
                                                    {needsSetup ? (
                                                        <Tooltip label={NEEDS_SETUP_HINT} withArrow>
                                                            <Badge
                                                                size="sm"
                                                                variant="light"
                                                                color="gray"
                                                                mt={6}
                                                                style={{ flexShrink: 0 }}
                                                                data-testid="needs-setup-badge"
                                                            >
                                                                Needs setup
                                                            </Badge>
                                                        </Tooltip>
                                                    ) : (
                                                        <span
                                                            aria-hidden
                                                            style={{
                                                                display: 'inline-block',
                                                                width: 84,
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    )}
                                                    <Tooltip label="Remove field">
                                                        <ActionIcon
                                                            aria-label="Remove field"
                                                            color="red"
                                                            variant="subtle"
                                                            mt={4}
                                                            disabled={form.values.form_fields.length <= 1}
                                                            onClick={() =>
                                                                form.removeListItem('form_fields', index)
                                                            }
                                                        >
                                                            <IconTrash size="0.9rem" />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            );
                                        })}
                                    </Stack>
                                </ScrollArea.Autosize>
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
                        <TextInput label="List heading" {...form.getInputProps('list_title')} />
                        <TextInput label="Detail heading" {...form.getInputProps('detail_title')} />
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
                        <Stack gap={4}>
                            <Text size="sm" fw={500}>
                                Pages that will be created
                            </Text>
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
                                            <Table.Td className={tableStyles.tableCell}>
                                                <Code>{route.role}</Code>
                                            </Table.Td>
                                            <Table.Td className={tableStyles.tableCell}>
                                                <Badge
                                                    color={route.surface === 'cms' ? 'grape' : 'blue'}
                                                    variant="light"
                                                    size="sm"
                                                >
                                                    {route.surface}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td className={tableStyles.tableCell}>
                                                <Code>{route.pattern}</Code>
                                            </Table.Td>
                                            <Table.Td className={tableStyles.tableCell}>
                                                <Text size="xs" lineClamp={1}>
                                                    {route.description}
                                                </Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Stack>
                    )}

                    <Group gap={6} c="dimmed">
                        <ThemeIcon size="xs" variant="transparent" color="gray">
                            <IconWand size="1rem" />
                        </ThemeIcon>
                        <Text size="xs">Uses POST /admin/cms-apps/{'{id}'}/scaffold</Text>
                    </Group>
                </Stack>
            )}
        </ModalWrapper>
    );
}
