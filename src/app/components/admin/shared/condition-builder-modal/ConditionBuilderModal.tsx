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
            initialValue ='{"and":[{"==":[{"var":"user_group"},"admin"]},{"and":[{"<":[{"var":"current_time"},"13:43"]},{"==":[{"var":"page_keyword"},"impressum"]},{"==":[{"var":"platform"},"mobile"]},{"==":[{"var":"language"},"3"]}]}]}';
            if (initialValue && initialValue.trim() !== '') {
                try {
                    const parsedValue = JSON.parse(initialValue);
                    console.log('Parsed initial value:', parsedValue);
                    console.log('Available fields for conversion:', Object.keys(groups).length, 'groups,', Object.keys(languages).length, 'languages,', Object.keys(platforms).length, 'platforms,', Object.keys(pages).length, 'pages');

                    if (isValidJsonLogic(parsedValue)) {
                        const convertedRules = jsonLogicToRules(parsedValue);
                        console.log('initialValue:', initialValue);
                        console.log('Converted rules:', convertedRules);

                        if (convertedRules && convertedRules.rules && convertedRules.rules.length > 0) {
                            setQuery(convertedRules);
                        } else {
                            setQuery(initialQuery);
                        }
                    } else {
                        console.warn('Invalid JSON Logic structure:', parsedValue);
                        setQuery(initialQuery);
                    }
                } catch (error) {
                    console.warn('Failed to parse initial condition value:', error);
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
            console.log('Saving query:', query);
            const jsonLogic = rulesToJsonLogic(query);
            console.log('Generated JSON Logic:', jsonLogic);

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
                    Build conditions using the query builder below. Use AND/OR for groups.
                </Text>
                <div className={`${classes.queryBuilder} validateQuery`}>
                    <QueryBuilderMantine>
                        <QueryBuilder
                            fields={fields}
                            query={query}
                            onQueryChange={setQuery}
                            validator={defaultValidator}
                            controlClassnames={{ queryBuilder: 'queryBuilder-justified queryBuilder-branches' }}
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