'use client';

import { useState, useCallback, useMemo } from 'react';
import {
    Stack,
    Group,
    TextInput,
    Select,
    Switch,
    Button,
    ActionIcon,
    Card,
    Text,
    Divider,
    Alert,
    Textarea
} from '@mantine/core';
import { IconPlus, IconTrash, IconFilter, IconAlertCircle } from '@tabler/icons-react';
import { FilterBuilderModal } from './FilterBuilderModal';
import { IDataSource } from './DataConfigModal';
import { useDataTables, useTableColumns } from '../../../../../hooks/useData';
import classes from './DataConfigModal.module.css';

interface IDataSourceFormProps {
    dataSource: IDataSource;
    onChange: (dataSource: IDataSource) => void;
    index: number;
}

// Real table/column data will be pulled from hooks; no mocks

const RETRIEVE_OPTIONS = [
    { value: 'first', label: 'First Record' },
    { value: 'last', label: 'Last Record' },
    { value: 'all', label: 'All Records' },
    { value: 'all_as_array', label: 'All as Array' },
    { value: 'JSON', label: 'JSON Format' }
];

export function DataSourceForm({ dataSource, onChange, index }: IDataSourceFormProps) {
    const [filterModalOpened, setFilterModalOpened] = useState(false);

    // Load tables and columns
    const { data: tablesResp, isLoading: isTablesLoading } = useDataTables();
    const { data: columnsResp, isLoading: isColumnsLoading } = useTableColumns(dataSource.table || undefined);

    const tableOptions = useMemo(() => {
        const tables = tablesResp?.dataTables || [];
        return tables.map((t) => ({ value: t.name, label: t.displayName ? `${t.displayName} (${t.name})` : t.name }));
    }, [tablesResp]);

    const columnOptions = useMemo(() => {
        const cols = columnsResp?.columns || [];
        return cols.map((c) => ({ value: c.name, label: c.name }));
    }, [columnsResp]);

    const handleFieldChange = useCallback((field: keyof IDataSource, value: any) => {
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

    const handleSaveFilter = useCallback((filterValue: string) => {
        handleFieldChange('filter', filterValue);
    }, [handleFieldChange]);

    return (
        <Stack gap="lg">
            <Text size="lg" fw={600}>
                Data Source {index + 1} Configuration
            </Text>

            {/* Basic Configuration */}
            <div className={classes.formGrid}>
                <div className={classes.gridCol2}>
                    <TextInput
                        label="Scope"
                        placeholder="Enter scope name"
                        value={dataSource.scope}
                        onChange={(e) => handleFieldChange('scope', e.target.value)}
                        required
                        description="Set data source scope name"
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

                <div className={classes.gridCol6}>
                    <Group gap="xs" align="flex-end">
                        <div style={{ flex: 1 }}>
                            <Textarea
                                label="Filter"
                                placeholder="Advanced SQL filter (optional)"
                                value={dataSource.filter}
                                onChange={(e) => handleFieldChange('filter', e.target.value)}
                                description="Advanced option to filter the data. When a filter is set, then the ordering for 'first' or 'last' should be manually set."
                                minRows={2}
                                maxRows={4}
                            />
                        </div>
                        <Button
                            variant="light"
                            leftSection={<IconFilter size={16} />}
                            onClick={() => setFilterModalOpened(true)}
                            mb="xs"
                        >
                            Builder
                        </Button>
                    </Group>
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
                                No fields configured. Click "Add Field" to specify which fields to load.
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
                                                <TextInput
                                                    label="Field Holder"
                                                    placeholder="var_name"
                                                    value={field.field_holder}
                                                    onChange={(e) => handleUpdateField(fieldIndex, 'field_holder', e.target.value)}
                                                    required
                                                    description="Variable name to use in templates ({{var_name}})"
                                                />
                                            </div>
                                            <div className={classes.gridCol4}>
                                                <TextInput
                                                    label="Not Found Text"
                                                    placeholder="Field not found"
                                                    value={field.not_found_text}
                                                    onChange={(e) => handleUpdateField(fieldIndex, 'not_found_text', e.target.value)}
                                                    required
                                                    description="Text to show if field is not found"
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
                                                    data={MOCK_FIELD_NAMES}
                                                    value={mapField.field_name}
                                                    onChange={(value) => handleUpdateMapField(mapFieldIndex, 'field_name', value || '')}
                                                    searchable
                                                    required
                                                    description="Take values from this field"
                                                />
                                            </div>
                                            <div className={classes.gridCol6}>
                                                <TextInput
                                                    label="New Field Name"
                                                    placeholder="new_field_name"
                                                    value={mapField.field_new_name}
                                                    onChange={(e) => handleUpdateMapField(mapFieldIndex, 'field_new_name', e.target.value)}
                                                    required
                                                    description="The new name that will be created"
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

            {/* Filter Builder Modal */}
            <FilterBuilderModal
                opened={filterModalOpened}
                onClose={() => setFilterModalOpened(false)}
                onSave={handleSaveFilter}
                initialValue={dataSource.filter}
                tableName={dataSource.table}
            />
        </Stack>
    );
}