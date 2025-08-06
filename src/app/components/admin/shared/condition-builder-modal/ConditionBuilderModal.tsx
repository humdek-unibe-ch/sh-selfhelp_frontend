'use client';

import { useState, useEffect } from 'react';
import { 
    Modal, 
    Button, 
    Group, 
    Stack, 
    Text, 
    LoadingOverlay,
    Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';
import { QueryBuilder, RuleGroupType, defaultValidator } from 'react-querybuilder';
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

    // Initialize query from initial value
    useEffect(() => {
        if (opened) {
            if (initialValue) {
                try {
                    const parsedValue = JSON.parse(initialValue);
                    if (isValidJsonLogic(parsedValue)) {
                        const convertedRules = jsonLogicToRules(parsedValue);
                        if (convertedRules && convertedRules.rules.length > 0) {
                            setQuery(convertedRules);
                        } else {
                            setQuery(initialQuery);
                        }
                    } else {
                        setQuery(initialQuery);
                    }
                } catch (error) {
                    console.warn('Failed to parse initial condition value:', error);
                    setQuery(initialQuery);
                }
            } else {
                setQuery(initialQuery);
            }
        }
    }, [opened, initialValue]);

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
            console.error('Failed to save condition:', error);
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

    const handleCancel = () => {
        onClose();
    };

    if (isError) {
        return (
            <Modal
                opened={opened}
                onClose={onClose}
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
            onClose={onClose}
            title={title}
            size="xl"
            centered
            closeOnClickOutside={false}
            closeOnEscape={false}
        >
            <LoadingOverlay visible={isLoading} />
            
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Build conditions using the query builder below. Use AND/OR for groups and drag & drop to reorder rules.
                </Text>

                <div className={classes.queryBuilder}>
                    <QueryBuilderMantine>
                        <QueryBuilder
                            fields={fields}
                            query={query}
                            onQueryChange={setQuery}
                            validator={defaultValidator}
                            controlClassnames={{ 
                                queryBuilder: `${classes.queryBuilderBranches} validateQuery`
                            }}
                            showCombinatorsBetweenRules
                            showNotToggle={false}
                            resetOnFieldChange={false}
                            resetOnOperatorChange={false}
                            addRuleToNewGroups
                            enableDragAndDrop
                            parseNumbers
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