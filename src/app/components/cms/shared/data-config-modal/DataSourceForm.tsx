/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState, useCallback, useMemo } from 'react';
import {
    Stack,
    Group,
    Select,
    Switch,
    Button,
    ActionIcon,
    Card,
    Text,
    Divider,
    Alert,
    Tooltip
} from '@mantine/core';
import { IconPlus, IconTrash, IconFilter, IconAlertCircle, IconLock, IconEdit } from '@tabler/icons-react';
import { FilterBuilderInline } from './FilterBuilderInline';
import { type IDataSource } from './DataConfigModal';
import { useDataTables, useTableColumns } from '../../../../../hooks/useData';
import { TextInputWithMentions } from '../field-components/TextInputWithMentions';
import classes from './DataConfigModal.module.css';

interface IDataSourceFormProps {
    dataSource: IDataSource;
    onChange: (dataSource: IDataSource) => void;
    index: number;
    dataVariables?: Record<string, string>;
}

// Real table/column data will be pulled from hooks; no mocks

const RETRIEVE_OPTIONS = [
    { value: 'first', label: 'First Record' },
    { value: 'last', label: 'Last Record' },
    { value: 'all', label: 'All Records' },
    { value: 'all_as_array', label: 'All as Array' },
    { value: 'JSON', label: 'JSON Format' }
];

export function DataSourceForm({ dataSource, onChange, index, dataVariables }: IDataSourceFormProps) {
    const [filterOpened, setFilterOpened] = useState(false);
    // Raw SQL filter is lock-protected to avoid accidental edits; unlocking
    // enables the `{{` interpolation picker (issue #56 v2 coverage).
    const [filterLocked, setFilterLocked] = useState(true);

    // Load tables and columns
    const { data: tablesResp, isLoading: isTablesLoading } = useDataTables();
    const _selectedTableId = useMemo(() => {
        if (!tablesResp?.dataTables || !dataSource.table) return undefined;
        const found = tablesResp.dataTables.find((t) => t.name === dataSource.table);
        return found?.id;
    }, [tablesResp, dataSource.table]);
    const { data: columnsResp, isLoading: isColumnsLoading } = useTableColumns(dataSource.table);

    const tableOptions = useMemo(() => {
        const tables = tablesResp?.dataTables || [];
        return tables.map((t) => ({ value: t.name, label: t.displayName ? `${t.displayName} (${t.name})` : t.name }));
    }, [tablesResp]);

    // The selected value is the immutable field_key (what the data resolver
    // stores/looks up); the label shows the human display_name when curated.
    const columnOptions = useMemo(() => {
        const seen = new Set<string>();
        const options: { value: string; label: string }[] = [];
        for (const col of columnsResp?.columns ?? []) {
            if (!col.fieldKey || seen.has(col.fieldKey)) {
                continue;
            }
            seen.add(col.fieldKey);
            options.push({
                value: col.fieldKey,
                label: col.displayName && col.displayName !== '' ? `${col.displayName} (${col.fieldKey})` : col.fieldKey,
            });
        }
        return options;
    }, [columnsResp?.columns]);

    const handleFieldChange = useCallback(<K extends keyof IDataSource>(field: K, value: IDataSource[K]) => {
        const updatedSource = { ...dataSource, [field]: value };
        onChange(updatedSource);
    }, [dataSource, onChange]);

    const handleAddField = useCallback(() => {
        const newField = {
            field_name: '',
            field_holder: '',
            not_found_text: ''
        };
        const updatedFields = [...dataSource.fields, newField];
        handleFieldChange('fields', updatedFields);
    }, [dataSource.fields, handleFieldChange]);

    const handleRemoveField = useCallback((fieldIndex: number) => {
        const updatedFields = dataSource.fields.filter((_, i) => i !== fieldIndex);
        handleFieldChange('fields', updatedFields);
    }, [dataSource.fields, handleFieldChange]);

    const handleUpdateField = useCallback((fieldIndex: number, fieldKey: string, value: string) => {
        const updatedFields = [...dataSource.fields];
        updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], [fieldKey]: value };
        handleFieldChange('fields', updatedFields);
    }, [dataSource.fields, handleFieldChange]);

    const handleAddMapField = useCallback(() => {
        const newMapField = {
            field_name: '',
            field_new_name: ''
        };
        const updatedMapFields = [...dataSource.map_fields, newMapField];
        handleFieldChange('map_fields', updatedMapFields);
    }, [dataSource.map_fields, handleFieldChange]);

    const handleRemoveMapField = useCallback((mapFieldIndex: number) => {
        const updatedMapFields = dataSource.map_fields.filter((_, i) => i !== mapFieldIndex);
        handleFieldChange('map_fields', updatedMapFields);
    }, [dataSource.map_fields, handleFieldChange]);

    const handleUpdateMapField = useCallback((mapFieldIndex: number, fieldKey: string, value: string) => {
        const updatedMapFields = [...dataSource.map_fields];
        updatedMapFields[mapFieldIndex] = { ...updatedMapFields[mapFieldIndex], [fieldKey]: value };
        handleFieldChange('map_fields', updatedMapFields);
    }, [dataSource.map_fields, handleFieldChange]);

    const handleSaveFilter = useCallback((payload: { sql: string }) => {
        // Save combined SQL only
        handleFieldChange('filter', payload.sql);
    }, [handleFieldChange]);

    interface IFilterConfig {
        mode?: 'builder' | 'sql';
        sql?: string;
        rules?: unknown;
        orderBy?: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
        limit?: number;
    }

    const _filterSummary = useMemo(() => {
        const raw = (dataSource.filter || '').trim();
        if (!raw) return '';
        try {
            const parsed = JSON.parse(raw) as IFilterConfig;
            if (typeof parsed !== 'object') return raw;
            const whereSql = parsed.sql || '';
            const orderSql = parsed.orderBy && parsed.orderBy.length > 0
                ? ` ORDER BY ${parsed.orderBy.map((o) => `${o.field} ${o.direction}`).join(', ')}`
                : '';
            const limitSql = typeof parsed.limit === 'number' && parsed.limit > 0 ? ` LIMIT ${parsed.limit}` : '';
            const combined = `${whereSql}${orderSql}${limitSql}`.trim();
            return combined || raw;
        } catch {
            return raw;
        }
    }, [dataSource.filter]);

    return (
        <Stack gap="lg">
            <Text size="lg" fw={600}>
                Data Source {index + 1} Configuration
            </Text>

            {/* Basic Configuration */}
            <div className={classes.formGrid}>
                <div className={classes.gridCol2}>
                    <TextInputWithMentions
                        fieldId={index * 100 + 1}
                        label="Scope"
                        placeholder="Enter scope name"
                        value={dataSource.scope}
                        onChange={(value) => handleFieldChange('scope', value)}
                        required
                        description="Set data source scope name"
                        dataVariables={dataVariables}
                    />
                </div>

                <div className={classes.gridCol6}>
                    <Select
                        label="Table Name"
                        placeholder="Select table"
                        data={tableOptions}
                        value={dataSource.table}
                        onChange={(value) => handleFieldChange('table', value || '')}
                        required
                        searchable
                        description="The name of the form that we want to load"
                        disabled={isTablesLoading}
                    />
                </div>

                <div className={classes.gridCol2}>
                    <Select
                        label="Return"
                        data={RETRIEVE_OPTIONS}
                        value={dataSource.retrieve}
                        onChange={(value) => handleFieldChange('retrieve', value as IDataSource['retrieve'])}
                        required
                        description="Return format for the data"
                    />
                </div>

                <div className={classes.gridCol2}>
                    <Switch
                        label="All fields"
                        description="Load all fields for the selected table"
                        checked={dataSource.all_fields}
                        onChange={(e) => handleFieldChange('all_fields', e.target.checked)}
                        mt="xl"
                    />
                </div>
            </div>

            <div className={classes.formGrid}>
                <div className={classes.gridCol6}>
                    <Switch
                        label="Data for the logged user"
                        description="If true, the loaded data is for the logged user, if false the loaded data is for all users in the system"
                        checked={dataSource.current_user}
                        onChange={(e) => handleFieldChange('current_user', e.target.checked)}
                    />
                </div>

                <div className={classes.gridCol12}>
                    <Card withBorder>
                        <Group justify="space-between" align="center">
                            <Text fw={500} className='opacity-0'>Filter</Text>
                            <Button variant="light" size="xs" leftSection={<IconFilter size={14} />} onClick={() => setFilterOpened((v) => !v)}>
                                {filterOpened ? 'Hide' : 'Show'} builder
                            </Button>
                        </Group>

                        {filterOpened && (
                            <div style={{ marginTop: 12 }} onBlurCapture={(_e) => {
                                // Apply on leaving the builder area
                                // child will call onSave on its own blur hooks
                              }}>
                                <FilterBuilderInline
                                    tableName={dataSource.table}
                                    initialSql={dataSource.filter}
                                    onSave={handleSaveFilter}
                                    dataVariables={dataVariables}
                                />
                            </div>
                        )}

                        <div style={{ marginTop: 12 }}>
                            <Group justify="space-between" align="center" mb={4}>
                                <Text size="sm" fw={500}>Filter (SQL only)</Text>
                                <Tooltip label={filterLocked ? 'Enable manual editing' : 'Lock manual editing'} position="left">
                                    <ActionIcon
                                        variant={filterLocked ? 'subtle' : 'filled'}
                                        color={filterLocked ? 'gray' : 'blue'}
                                        onClick={() => setFilterLocked((v) => !v)}
                                        className="cursor-pointer"
                                    >
                                        {filterLocked ? <IconLock size="1rem" /> : <IconEdit size="1rem" />}
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                            <TextInputWithMentions
                                fieldId={index}
                                value={dataSource.filter || ''}
                                onChange={(val) => handleFieldChange('filter', val)}
                                disabled={filterLocked}
                                placeholder="Combined WHERE/ORDER/LIMIT. If WHERE is present it must start with AND ..."
                                dataVariables={dataVariables}
                            />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Fields Configuration - Only show if all_fields is false */}
            {!dataSource.all_fields && (
                <>
                    <Divider label="Fields Configuration" labelPosition="center" />
                    
                    <div className={classes.fieldArray}>
                        <div className={classes.fieldArrayHeader}>
                            <Text fw={500}>Fields</Text>
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<IconPlus size={14} />}
                                onClick={handleAddField}
                            >
                                Add Field
                            </Button>
                        </div>

                        {dataSource.fields.length === 0 ? (
                            <Alert variant="light" color="blue" icon={<IconAlertCircle size={16} />}>
                                No fields configured. Click &quot;Add Field&quot; to specify which fields to load.
                            </Alert>
                        ) : (
                            <Stack gap="sm">
                                {dataSource.fields.map((field, fieldIndex) => (
                                    <div key={fieldIndex} className={classes.fieldArrayItem}>
                                        <Group justify="space-between" mb="sm">
                                            <Text size="sm" fw={500}>Field {fieldIndex + 1}</Text>
                                            <ActionIcon
                                                color="red"
                                                variant="subtle"
                                                size="sm"
                                                onClick={() => handleRemoveField(fieldIndex)}
                                            >
                                                <IconTrash size={14} />
                                            </ActionIcon>
                                        </Group>
                                        
                                        <div className={classes.formGrid}>
                                            <div className={classes.gridCol4}>
                                                <Select
                                                    label="Field Name"
                                                    placeholder="Select field"
                                                    data={columnOptions}
                                                    value={field.field_name}
                                                    onChange={(value) => handleUpdateField(fieldIndex, 'field_name', value || '')}
                                                    searchable
                                                    required
                                                    description="The field name in the form or table"
                                                    disabled={isColumnsLoading || !dataSource.table}
                                                />
                                            </div>
                                            <div className={classes.gridCol4}>
                                                <TextInputWithMentions
                                                    fieldId={index * 100 + fieldIndex * 10 + 2}
                                                    label="Field Holder"
                                                    placeholder="var_name"
                                                    value={field.field_holder}
                                                    onChange={(value) => handleUpdateField(fieldIndex, 'field_holder', value)}
                                                    required
                                                    description="Variable name to use in templates ({{var_name}})"
                                                    dataVariables={dataVariables}
                                                />
                                            </div>
                                            <div className={classes.gridCol4}>
                                                <TextInputWithMentions
                                                    fieldId={index * 100 + fieldIndex * 10 + 3}
                                                    label="Not Found Text"
                                                    placeholder="Field not found"
                                                    value={field.not_found_text}
                                                    onChange={(value) => handleUpdateField(fieldIndex, 'not_found_text', value)}
                                                    required
                                                    description="Text to show if field is not found"
                                                    dataVariables={dataVariables}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Stack>
                        )}
                    </div>
                </>
            )}

            {/* Map Fields Configuration - Only show if retrieve is 'JSON' */}
            {dataSource.retrieve === 'JSON' && (
                <>
                    <Divider label="Map Fields Configuration" labelPosition="center" />
                    
                    <div className={classes.fieldArray}>
                        <div className={classes.fieldArrayHeader}>
                            <Text fw={500}>Map Fields</Text>
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<IconPlus size={14} />}
                                onClick={handleAddMapField}
                            >
                                Add Map Field
                            </Button>
                        </div>

                        {dataSource.map_fields.length === 0 ? (
                            <Alert variant="light" color="blue" icon={<IconAlertCircle size={16} />}>
                                No field mappings configured. Add mappings to rename fields in JSON output.
                            </Alert>
                        ) : (
                            <Stack gap="sm">
                                {dataSource.map_fields.map((mapField, mapFieldIndex) => (
                                    <div key={mapFieldIndex} className={classes.fieldArrayItem}>
                                        <Group justify="space-between" mb="sm">
                                            <Text size="sm" fw={500}>Map Field {mapFieldIndex + 1}</Text>
                                            <ActionIcon
                                                color="red"
                                                variant="subtle"
                                                size="sm"
                                                onClick={() => handleRemoveMapField(mapFieldIndex)}
                                            >
                                                <IconTrash size={14} />
                                            </ActionIcon>
                                        </Group>
                                        
                                        <div className={classes.formGrid}>
                                            <div className={classes.gridCol6}>
                                                <Select
                                                    label="Field Name"
                                                    placeholder="Select source field"
                                                    data={columnOptions}
                                                    value={mapField.field_name}
                                                    onChange={(value) => handleUpdateMapField(mapFieldIndex, 'field_name', value || '')}
                                                    searchable
                                                    required
                                                    description="Take values from this field"
                                                    disabled={isColumnsLoading || !dataSource.table}
                                                />
                                            </div>
                                            <div className={classes.gridCol6}>
                                                <TextInputWithMentions
                                                    fieldId={index * 100 + mapFieldIndex * 10 + 4}
                                                    label="New Field Name"
                                                    placeholder="new_field_name"
                                                    value={mapField.field_new_name}
                                                    onChange={(value) => handleUpdateMapField(mapFieldIndex, 'field_new_name', value)}
                                                    required
                                                    description="The new name that will be created"
                                                    dataVariables={dataVariables}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Stack>
                        )}
                    </div>
                </>
            )}

            {/* Inline Builder (no modal) handled above in card */}
        </Stack>
    );
}