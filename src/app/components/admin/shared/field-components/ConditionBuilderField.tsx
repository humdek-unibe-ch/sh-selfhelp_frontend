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
        console.log('ConditionBuilderField hasCondition check:', {
            fieldId,
            fieldName,
            value,
            valueType: typeof value,
            valueLength: typeof value === 'string' ? value.length : 'N/A'
        });
        
        if (!value || value.trim() === '') {
            console.log('ConditionBuilderField: No value or empty value');
            return false;
        }
        
        try {
            const parsed = JSON.parse(value);
            const isValid = isValidJsonLogic(parsed) && Object.keys(parsed).length > 0;
            console.log('ConditionBuilderField: Parsed condition:', {
                parsed,
                isValidJsonLogic: isValidJsonLogic(parsed),
                hasKeys: Object.keys(parsed).length > 0,
                isValid
            });
            return isValid;
        } catch (error) {
            console.log('ConditionBuilderField: Failed to parse JSON:', error);
            return false;
        }
    })();

    const handleSave = async (jsonLogic: any) => {
        const jsonString = jsonLogic && Object.keys(jsonLogic).length > 0 ? JSON.stringify(jsonLogic, null, 2) : '';
        console.log('ConditionBuilderField handleSave:', {
            fieldId,
            fieldName,
            jsonLogic,
            jsonString,
            onChange: typeof onChange,
            currentValue: value
        });
        
        // Call onChange to update the form
        onChange(jsonString);
        
        console.log('ConditionBuilderField onChange called with:', jsonString);
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

    const getConditionSummary = () => {
        if (!hasCondition) {
            console.log('ConditionBuilderField: No condition for summary');
            return 'Condition configured';
        }
        
        try {
            const parsed = JSON.parse(value);
            // Try to provide a basic summary of the condition structure
            const keys = Object.keys(parsed);
            if (keys.length > 0) {
                const mainOperator = keys[0];
                const summary = `Condition set (${mainOperator})`;
                console.log('ConditionBuilderField: Generated summary:', summary);
                return summary;
            }
            console.log('ConditionBuilderField: No keys in parsed condition');
            return 'Condition configured';
        } catch (error) {
            console.log('ConditionBuilderField: Failed to generate summary:', error);
            return 'Condition present';
        }
    };

    const buttonProps = getButtonProps();
    console.log('ConditionBuilderField: Rendering button with props:', {
        fieldId,
        fieldName,
        hasCondition,
        buttonProps,
        disabled,
        value: value.substring(0, 100) + (value.length > 100 ? '...' : '') // Truncate for logging
    });

    return (
        <Stack gap="xs">
            <Group gap="xs" align="center">
                <Button
                    {...buttonProps}
                    onClick={handleOpenModal}
                    disabled={disabled}
                    size="sm"
                />
                
                {hasCondition && (
                    <Text size="xs" c="dimmed">
                        {getConditionSummary()}
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