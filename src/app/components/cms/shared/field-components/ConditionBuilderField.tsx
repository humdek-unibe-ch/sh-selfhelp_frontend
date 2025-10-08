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
    addLabel?: string;
    editLabel?: string;
}

export function ConditionBuilderField({
    fieldId,
    fieldName,
    value,
    onChange,
    disabled = false,
    placeholder,
    addLabel = 'Add Condition',
    editLabel = 'Edit Condition'
}: IConditionBuilderFieldProps) {
    const [modalOpened, setModalOpened] = useState(false);

    // Check if there's a valid condition
    const hasCondition = (() => {

        
        if (!value || value.trim() === '') {

            return false;
        }
        
        try {
            const parsed = JSON.parse(value);
            const isValid = isValidJsonLogic(parsed) && Object.keys(parsed).length > 0;

            return isValid;
        } catch (error) {

            return false;
        }
    })();

    const handleSave = async (jsonLogic: any) => {
        const jsonString = jsonLogic && Object.keys(jsonLogic).length > 0 ? JSON.stringify(jsonLogic, null, 2) : '';

        
        // Call onChange to update the form
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
                children: editLabel
            };
        } else {
            return {
                variant: 'light' as const,
                color: 'blue',
                leftSection: <IconPlus size={16} />,
                children: addLabel
            };
        }
    };

    const getConditionSummary = () => {
        if (!hasCondition) {

            return 'Condition configured';
        }
        
        try {
            const parsed = JSON.parse(value);
            // Try to provide a basic summary of the condition structure
            const keys = Object.keys(parsed);
            if (keys.length > 0) {
                const mainOperator = keys[0];
                const summary = `Condition set (${mainOperator})`;

                return summary;
            }

            return 'Condition configured';
        } catch (error) {

            return 'Condition present';
        }
    };

    const buttonProps = getButtonProps();


    return (
        <Stack gap="xs">
            <Group gap="xs" align="center">
                <Button
                    {...buttonProps}
                    onClick={handleOpenModal}
                    disabled={disabled}
                    size="sm"
                />
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