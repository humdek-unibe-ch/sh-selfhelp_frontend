'use client';

import { useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import { DataConfigModal } from '../data-config-modal/DataConfigModal';

interface IDataConfigFieldProps {
    fieldId: number;
    fieldName?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    dataVariables?: Record<string, string>;
}

export function DataConfigField({
    fieldId,
    fieldName,
    value,
    onChange,
    disabled = false,
    placeholder,
    dataVariables
}: IDataConfigFieldProps) {
    const [modalOpened, setModalOpened] = useState(false);

    // Check if there's a valid data configuration
    const hasDataConfig = (() => {
        if (!value || value.trim() === '') return false;
        
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) && parsed.length > 0;
        } catch {
            return false;
        }
    })();

    const handleSave = async (dataConfig: any[]) => {
        const jsonString = dataConfig && dataConfig.length > 0 ? JSON.stringify(dataConfig, null, 2) : '';

        onChange(jsonString);
    };

    const handleOpenModal = () => {
        if (!disabled) {
            setModalOpened(true);
        }
    };

    const getButtonProps = () => {
        if (hasDataConfig) {
            return {
                variant: 'light' as const,
                color: 'orange',
                leftSection: <IconEdit size={16} />,
                children: 'Edit Data Config'
            };
        } else {
            return {
                variant: 'light' as const,
                color: 'blue',
                leftSection: <IconPlus size={16} />,
                children: 'Add Data Config'
            };
        }
    };

    const getConfigSummary = () => {
        if (!hasDataConfig) return null;
        
        try {
            const parsed = JSON.parse(value);
            const count = parsed.length;
            const scopes = parsed.map((config: any) => config.scope).filter(Boolean);
            return `${count} data source${count !== 1 ? 's' : ''} configured${scopes.length > 0 ? ` (${scopes.join(', ')})` : ''}`;
        } catch {
            return 'Configuration present';
        }
    };

    return (
        <Stack gap="xs">
            <Group gap="xs" align="center">
                <Button
                    {...getButtonProps()}
                    onClick={handleOpenModal}
                    disabled={disabled}
                    size="sm"
                />
                
                {hasDataConfig && (
                    <Text size="xs" c="dimmed">
                        {getConfigSummary()}
                    </Text>
                )}
            </Group>

            {/* Hidden input to store the actual value */}
            <input
                type="hidden"
                name={fieldName}
                value={value}
                data-field-id={fieldId}
            />

            <DataConfigModal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                onSave={handleSave}
                initialValue={value}
                title={`Data Config Builder${fieldName ? ` - ${fieldName}` : ''}`}
                dataVariables={dataVariables}
            />
        </Stack>
    );
}