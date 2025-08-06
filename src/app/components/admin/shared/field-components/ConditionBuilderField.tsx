'use client';

import { useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import { ConditionBuilderModal } from '../condition-builder-modal/ConditionBuilderModal';
import { isValidJsonLogic } from '../../../../../utils/json-logic-conversion.utils';

interface IConditionBuilderFieldProps {
    fieldId: number;
    fieldName?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function ConditionBuilderField({
    fieldId,
    fieldName,
    value,
    onChange,
    disabled = false,
    placeholder
}: IConditionBuilderFieldProps) {
    const [modalOpened, setModalOpened] = useState(false);

    // Check if there's a valid condition
    const hasCondition = (() => {
        if (!value || value.trim() === '') return false;
        
        try {
            const parsed = JSON.parse(value);
            return isValidJsonLogic(parsed) && Object.keys(parsed).length > 0;
        } catch {
            return false;
        }
    })();

    const handleSave = async (jsonLogic: any) => {
        const jsonString = jsonLogic ? JSON.stringify(jsonLogic) : '';
        console.log('ConditionBuilderField handleSave:', {
            fieldId,
            fieldName,
            jsonLogic,
            jsonString,
            onChange: typeof onChange
        });
        onChange(jsonString);
    };

    const handleOpenModal = () => {
        if (!disabled) {
            setModalOpened(true);
        }
    };

    const getButtonProps = () => {
        if (hasCondition) {
            return {
                variant: 'light' as const,
                color: 'yellow',
                leftSection: <IconEdit size={16} />,
                children: 'Edit Condition'
            };
        } else {
            return {
                variant: 'light' as const,
                color: 'blue',
                leftSection: <IconPlus size={16} />,
                children: 'Add Condition'
            };
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
                
                {hasCondition && (
                    <Text size="xs" c="dimmed">
                        Condition configured
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

            <ConditionBuilderModal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                onSave={handleSave}
                initialValue={value}
                title={`Condition Builder${fieldName ? ` - ${fieldName}` : ''}`}
            />
        </Stack>
    );
}