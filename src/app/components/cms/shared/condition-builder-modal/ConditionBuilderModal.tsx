'use client';

import { useState, useEffect } from 'react';
import {
    Modal,
    Button,
    Group,
    Stack,
    Text,
    LoadingOverlay,
    Alert,
    Select,
    TextInput,
    ActionIcon
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX, IconPlus } from '@tabler/icons-react';
import { defaultValidator, QueryBuilder, RuleGroupType } from 'react-querybuilder';
import { QueryBuilderMantine } from '@react-querybuilder/mantine';
import 'react-querybuilder/dist/query-builder.css';
import { useConditionBuilderData } from '../../../../../hooks/useConditionBuilderData';
import { rulesToJsonLogic, jsonLogicToRules, isValidJsonLogic } from '../../../../../utils/json-logic-conversion.utils';
import { createConditionFields } from './conditionFields';
import classes from './ConditionBuilderModal.module.css';

interface IConditionBuilderModalProps {
    opened: boolean;
    onClose: () => void;
    onSave: (jsonLogic: any) => void;
    initialValue?: string;
    title?: string;
}

const initialQuery: RuleGroupType = {
    combinator: 'and',
    rules: []
};

// Custom field selector with toggle between dropdown and custom input
function CreatableFieldSelector(props: any) {
    const { value, options, onChange, handleOnChange, ...otherProps } = props;

    // react-querybuilder might use handleOnChange instead of onChange
    const changeHandler = onChange || handleOnChange;

    if (!changeHandler) {
        return <div>Error: No change handler</div>;
    }

    const [isCustomMode, setIsCustomMode] = useState(false);

    // Check if current value is a custom variable (starts and ends with {{ }})
    const isCustomVariable = value && typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');

    // If we have a custom variable, automatically switch to custom mode
    useEffect(() => {
        if (isCustomVariable && !isCustomMode) {
            setIsCustomMode(true);
        }
    }, [isCustomVariable, isCustomMode]);

    const fieldOptions = options.map((opt: any) => ({
        value: opt.name,
        label: opt.label
    }));

    const handleToggleMode = () => {
        if (isCustomMode) {
            // Switching from custom mode to dropdown mode
            // Clear the custom variable and return to empty state
            changeHandler('');
        }
        setIsCustomMode(!isCustomMode);
    };

    if (isCustomMode) {
        // Custom variable input mode
        return (
            <Group gap={0} wrap="nowrap">
                <TextInput
                    value={value || ''}
                    onChange={(event) => changeHandler(event.currentTarget.value)}
                    placeholder="Enter custom variable (e.g. {{my_var}})"
                    size="xs"
                    style={{ flex: 1 }}
                />
                <ActionIcon
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={handleToggleMode}
                    title="Remove custom variable"
                >
                    <IconX size={14} />
                </ActionIcon>
            </Group>
        );
    }

    // Normal dropdown mode
    return (
        <Group gap={0} wrap="nowrap">
            <Select
                value={value || null}
                onChange={(newValue) => changeHandler(newValue)}
                data={fieldOptions}
                placeholder="Select field"
                size="xs"
                clearable
                style={{ flex: 1 }}
            />
            <ActionIcon
                variant="subtle"
                color="blue"
                size="xs"
                onClick={handleToggleMode}
                title="Add custom variable"
            >
                <IconPlus size={14} />
            </ActionIcon>
        </Group>
    );
}

export function ConditionBuilderModal({
    opened,
    onClose,
    onSave,
    initialValue,
    title = "Condition Builder"
}: IConditionBuilderModalProps) {
    const { groups, languages, platforms, pages, isLoading, isError } = useConditionBuilderData();
    const [query, setQuery] = useState<RuleGroupType>(initialQuery);
    const [isSaving, setIsSaving] = useState(false);

    // Create fields with dynamic data
    const fields = createConditionFields(groups, languages, platforms, pages);    

    // Initialize query from initial value - only after data is loaded
    useEffect(() => {
        if (opened && !isLoading && !isError) {
            if (initialValue && initialValue.trim() !== '') {
                try {
                    const parsedValue = JSON.parse(initialValue);


                    if (isValidJsonLogic(parsedValue)) {
                        const convertedRules = jsonLogicToRules(parsedValue);


                        if (convertedRules && convertedRules.rules && convertedRules.rules.length > 0) {
                            setQuery(convertedRules);
                        } else {
                            setQuery(initialQuery);
                        }
                    } else {

                        setQuery(initialQuery);
                    }
                } catch (error) {

                    setQuery(initialQuery);
                }
            } else {
                setQuery(initialQuery);
            }
        } else if (opened && !isLoading && !isError && !initialValue) {
            // Reset to initial query if no initial value and data is loaded
            setQuery(initialQuery);
        }
    }, [opened, initialValue, isLoading, isError, groups, languages, platforms, pages]);

    const handleSave = async () => {
        setIsSaving(true);
        
        try {
            const jsonLogic = rulesToJsonLogic(query);
            
            await onSave(jsonLogic);
            
            notifications.show({
                title: 'Success',
                message: 'Condition saved successfully',
                color: 'green',
                icon: <IconCheck size={16} />,
            });
            
            onClose();
        } catch (error) {

            notifications.show({
                title: 'Error',
                message: 'Failed to save condition',
                color: 'red',
                icon: <IconX size={16} />,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setQuery(initialQuery);
        onClose();
    };

    const handleCancel = () => {
        handleClose();
    };

    if (isError) {
        return (
            <Modal
                opened={opened}
                onClose={handleClose}
                title={title}
                size="xl"
                centered
            >
                <Alert
                    icon={<IconAlertTriangle size={16} />}
                    title="Error"
                    color="red"
                    variant="light"
                >
                    Failed to load condition builder data. Please try again.
                </Alert>
            </Modal>
        );
    }

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={title}
            size="xl"
            centered
            closeOnClickOutside={false}
            closeOnEscape={false}
        >
            <LoadingOverlay visible={isLoading} />

            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Build conditions using the query builder below. Use AND/OR for groups.
                </Text>
                <div className={`${classes.queryBuilder} validateQuery`}>
                    <QueryBuilderMantine>
                        <QueryBuilder
                            fields={fields}
                            query={query}
                            onQueryChange={setQuery}
                            validator={defaultValidator}
                            controlElements={{
                                fieldSelector: CreatableFieldSelector
                            }}
                            controlClassnames={{
                                queryBuilder: 'queryBuilder-justified queryBuilder-branches',
                                ruleGroup: 'ruleGroup',
                                rule: 'rule',
                                addRule: 'addRule',
                                addGroup: 'addGroup',
                                cloneRule: 'cloneRule',
                                cloneGroup: 'cloneGroup',
                                removeRule: 'removeRule',
                                removeGroup: 'removeGroup'
                            }}
                            resetOnFieldChange={true}
                        />
                    </QueryBuilderMantine>
                </div>

                <Group justify="flex-end" gap="sm">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        loading={isSaving}
                        disabled={isLoading}
                    >
                        Save Condition
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}