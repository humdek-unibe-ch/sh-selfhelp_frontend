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