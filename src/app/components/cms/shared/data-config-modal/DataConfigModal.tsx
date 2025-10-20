'use client';

import { useState, useEffect } from 'react';
import {
    Button,
    Group,
    Stack,
    Text,
    LoadingOverlay,
    Alert,
    Tabs,
    Card,
    Badge,
    ActionIcon
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX, IconPlus, IconTrash } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal';
import { DataSourceForm } from './DataSourceForm';
import classes from './DataConfigModal.module.css';
  import { formatQuery } from 'react-querybuilder';

export interface IDataSource {
    current_user: boolean;
    all_fields: boolean;
    scope: string;
    table: string;
    retrieve: 'first' | 'last' | 'all' | 'all_as_array' | 'JSON';
    filter: string;
    fields: Array<{
        field_name: string;
        field_holder: string;
        not_found_text: string;
    }>;
    map_fields: Array<{
        field_name: string;
        field_new_name: string;
    }>;
}

interface IDataConfigModalProps {
    opened: boolean;
    onClose: () => void;
    onSave: (dataConfig: IDataSource[]) => void;
    initialValue?: string;
    title?: string;
    dataVariables?: Record<string, string>;
}

export function DataConfigModal({
    opened,
    onClose,
    onSave,
    initialValue,
    title = "Data Config Builder",
    dataVariables
}: IDataConfigModalProps) {
    const [dataSources, setDataSources] = useState<IDataSource[]>([]);
    const [activeTab, setActiveTab] = useState<string>('0');
    const [isSaving, setIsSaving] = useState(false);

    // Initialize data sources from initial value
    useEffect(() => {
        if (opened && initialValue) {
            try {
                const parsed = JSON.parse(initialValue);
                if (Array.isArray(parsed)) {
                    setDataSources(parsed);
                    if (parsed.length > 0) {
                        setActiveTab('0');
                    }
                } else {
                    setDataSources([]);
                }
            } catch (error) {

                setDataSources([]);
            }
        } else if (opened) {
            setDataSources([]);
        }
    }, [opened, initialValue]);

    const createNewDataSource = (): IDataSource => ({
        current_user: true,
        all_fields: true,
        scope: '',
        table: '',
        retrieve: 'first',
        filter: '',
        fields: [],
        map_fields: []
    });

    const handleAddDataSource = () => {
        const newDataSource = createNewDataSource();
        const updatedSources = [...dataSources, newDataSource];
        setDataSources(updatedSources);
        setActiveTab((updatedSources.length - 1).toString());
    };

    const handleRemoveDataSource = (index: number) => {
        const updatedSources = dataSources.filter((_, i) => i !== index);
        setDataSources(updatedSources);
        
        // Adjust active tab if necessary
        if (updatedSources.length === 0) {
            setActiveTab('0');
        } else if (parseInt(activeTab) >= updatedSources.length) {
            setActiveTab((updatedSources.length - 1).toString());
        }
    };

    const handleUpdateDataSource = (index: number, updatedSource: IDataSource) => {
        const updatedSources = [...dataSources];
        updatedSources[index] = updatedSource;
        setDataSources(updatedSources);
    };

    const handleSave = async () => {
        setIsSaving(true);
        
        try {
            // Validate data sources
            const errors: string[] = [];
            
            dataSources.forEach((source, index) => {
                if (!source.scope.trim()) {
                    errors.push(`Data Source ${index + 1}: Scope is required`);
                }
                if (!source.table.trim()) {
                    errors.push(`Data Source ${index + 1}: Table name is required`);
                }
                if (!source.all_fields && source.fields.length === 0) {
                    errors.push(`Data Source ${index + 1}: Fields are required when "All fields" is disabled`);
                }
            });

            if (errors.length > 0) {
                notifications.show({
                    title: 'Validation Error',
                    message: errors.join('\n'),
                    color: 'red',
                    icon: <IconAlertTriangle size={16} />,
                    autoClose: false
                });
                return;
            }

            // Normalize filter to hold only pure SQL
            const normalizedSources = dataSources.map((source) => {
                // filter is already the combined SQL; just keep it
                return { ...source, filter: (source.filter || '').trim() };
            });


            await onSave(normalizedSources);
            
            notifications.show({
                title: 'Success',
                message: 'Data configuration saved successfully',
                color: 'green',
                icon: <IconCheck size={16} />
            });
            
            onClose();
        } catch (error) {

            notifications.show({
                title: 'Error',
                message: 'Failed to save data configuration',
                color: 'red',
                icon: <IconX size={16} />
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setDataSources([]);
        setActiveTab('0');
        onClose();
    };

    return (
        <ModalWrapper
            opened={opened}
            onClose={handleClose}
            title={title}
            size="90vw"
            onSave={handleSave}
            onCancel={handleClose}
            isLoading={isSaving}
            saveLabel="Save Configuration"
            cancelLabel="Cancel"
            disabled={dataSources.length === 0}
            scrollAreaHeight="70vh"
            modalStyles={{
                content: { height: '90vh' },
            }}
        >
            <LoadingOverlay visible={isSaving} />

            <Stack gap="md">
                {dataSources.length === 0 ? (
                    <Alert variant="light" color="blue" icon={<IconPlus size={16} />}>
                        <Text>No data sources configured. Click &quot;Add Data Source&quot; to get started.</Text>
                    </Alert>
                ) : (
                    <Tabs value={activeTab} onChange={(value) => setActiveTab(value || '0')} className={classes.tabs}>
                        <Group justify="space-between" mb="sm">
                            <Tabs.List>
                                {dataSources.map((source, index) => (
                                    <Tabs.Tab
                                        key={index}
                                        value={index.toString()}
                                        rightSection={
                                            dataSources.length > 1 ? (
                                                <ActionIcon
                                                    component="div"
                                                    size="xs"
                                                    color="red"
                                                    variant="subtle"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveDataSource(index);
                                                    }}
                                                >
                                                    <IconTrash size={12} />
                                                </ActionIcon>
                                            ) : null
                                        }
                                    >
                                        <Group gap="xs">
                                            <Text size="sm">
                                                Data Source {index + 1}
                                            </Text>
                                            {source.scope && (
                                                <Badge size="xs" variant="light">
                                                    {source.scope}
                                                </Badge>
                                            )}
                                        </Group>
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                        </Group>

                        {dataSources.map((source, index) => (
                            <Tabs.Panel key={index} value={index.toString()}>
                                <Card withBorder p="lg">
                                    <DataSourceForm
                                        dataSource={source}
                                        onChange={(updatedSource) => handleUpdateDataSource(index, updatedSource)}
                                        index={index}
                                        dataVariables={dataVariables}
                                    />
                                </Card>
                            </Tabs.Panel>
                        ))}
                    </Tabs>
                )}

                <Group justify="flex-start">
                    <Button
                        variant="light"
                        leftSection={<IconPlus size={16} />}
                        onClick={handleAddDataSource}
                    >
                        Add Data Source
                    </Button>
                </Group>
            </Stack>
        </ModalWrapper>
    );
}