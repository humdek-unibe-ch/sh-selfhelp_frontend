'use client';

import React, { useState, useEffect } from 'react';
import {
    Stack,
    Text,
    LoadingOverlay,
    Alert,
    TextInput,
    ActionIcon,
    Tooltip,
    Select
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX, IconLock, IconLockOpen } from '@tabler/icons-react';
import { defaultValidator, QueryBuilder, RuleGroupType } from 'react-querybuilder';
import { MantineValueEditor, QueryBuilderMantine } from '@react-querybuilder/mantine';
import 'react-querybuilder/dist/query-builder.css';
import { ModalWrapper } from '../../../shared/common/CustomModal';
import { useConditionBuilderData } from '../../../../../hooks/useConditionBuilderData';
import { rulesToJsonLogic, jsonLogicToRules, isValidJsonLogic } from '../../../../../utils/json-logic-conversion.utils';
import { createConditionFields } from './conditionFields';
import { TextInputWithMentions } from '../field-components/TextInputWithMentions';

interface IConditionBuilderModalProps {
    opened: boolean;
    onClose: () => void;
    onSave: (jsonLogic: any) => void;
    initialValue?: string;
    title?: string;
    dataVariables?: Record<string, string>;
}

const initialQuery: RuleGroupType = {
    combinator: 'and',
    rules: []
};

// Custom field selector with LockedField-style design
function createCreatableFieldSelector(dataVariables?: Record<string, string>) {
    return function CreatableFieldSelector(props: any) {
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

        const toggleTooltip = isCustomMode ? "Lock to field selection" : "Unlock for custom variable";

        if (isCustomMode) {
            // Custom variable input mode with lock button
            return (
                <div style={{ position: 'relative' }}>
                    <TextInputWithMentions
                        fieldId={0}
                        value={value || ''}
                        onChange={changeHandler}
                        placeholder="{{my_var}}"
                        dataVariables={dataVariables}
                    />
                    <div style={{ 
                        position: 'absolute', 
                        right: '8px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        zIndex: 10
                    }}>
                        <Tooltip label={toggleTooltip} position="left">
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                onClick={handleToggleMode}
                            >
                                <IconLockOpen size="1rem" />
                            </ActionIcon>
                        </Tooltip>
                    </div>
                </div>
            );
        }

        // Normal dropdown mode - using Mantine Select
        return (
            <Select
                value={value || null}
                onChange={(newValue) => changeHandler(newValue)}
                data={fieldOptions}
                placeholder="Select field"
                size="sm"
                searchable
                rightSection={
                    <div onClick={handleToggleMode} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Tooltip label={toggleTooltip} position="left">
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                component="div"
                            >
                                <IconLock size="1rem" />
                            </ActionIcon>
                        </Tooltip>
                    </div>
                }
                rightSectionPointerEvents="all"
                styles={{
                    wrapper: { width: '100%' },
                    input: { width: '100%' }
                }}
            />
        );
    };
}

// Custom value editor that supports both dropdown and text input with mentions
function createSearchableValueEditor(dataVariables?: Record<string, string>) {
    return function SearchableValueEditor(props: any) {
        const {
            value,
            values,
            onChange,
            handleOnChange,
            fieldData,
            type,
            ...otherProps
        } = props;

        // react-querybuilder might use handleOnChange instead of onChange
        const changeHandler = onChange || handleOnChange;

        if (!changeHandler) {
            return <div>Error: No change handler</div>;
        }

        const [isTextMode, setIsTextMode] = useState(false);

        // Check if current value is a custom variable or contains brackets (suggesting variable usage)
        const isCustomVariable = value && typeof value === 'string' && (value.startsWith('{{') || value.includes('{{'));

        // If we have a custom variable, automatically switch to text mode
        useEffect(() => {
            if (isCustomVariable && !isTextMode) {
                setIsTextMode(true);
            }
        }, [isCustomVariable, isTextMode]);

        const handleToggleMode = () => {
            setIsTextMode(!isTextMode);
        };

        const toggleTooltip = isTextMode ? "Switch to dropdown" : "Switch to text input for variables";

        // Only handle select fields with values
        const isSelectType = type === 'select' || fieldData?.valueEditorType === 'select';
        if (isSelectType && values && Array.isArray(values) && values.length > 0) {
            const valueOptions = values.map((opt: any) => ({
                value: opt.name,
                label: opt.label
            }));

            if (isTextMode) {
                // Text mode with mentions and lock button
                return (
                    <div style={{ position: 'relative' }}>
                        <TextInputWithMentions
                            fieldId={0}
                            value={value || ''}
                            onChange={changeHandler}
                            placeholder="Use {{variable}} or enter value"
                            dataVariables={dataVariables}
                        />
                        <div style={{ 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            zIndex: 10
                        }}>
                            <Tooltip label={toggleTooltip} position="left">
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    size="sm"
                                    onClick={handleToggleMode}
                                >
                                    <IconLockOpen size="1rem" />
                                </ActionIcon>
                            </Tooltip>
                        </div>
                    </div>
                );
            } else {
                // Dropdown mode
                return (
                    <Select
                        value={value || null}
                        onChange={(newValue) => changeHandler(newValue)}
                        data={valueOptions}
                        placeholder="Select value"
                        size="sm"
                        searchable
                        rightSection={
                            <div onClick={handleToggleMode} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Tooltip label={toggleTooltip} position="left">
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                        component="div"
                                    >
                                        <IconLockOpen size="1rem" />
                                    </ActionIcon>
                                </Tooltip>
                            </div>
                        }
                        rightSectionPointerEvents="all"
                        styles={{
                            wrapper: { width: '100%' },
                            input: { width: '100%' }
                        }}
                    />
                );
            }
        }

        // For date/datetime/time fields, use default MantineValueEditor
        const isDateTimeField = fieldData?.inputType === 'date' ||
                               fieldData?.inputType === 'datetime-local' ||
                               fieldData?.inputType === 'time';

        if (isDateTimeField) {
            return <MantineValueEditor {...props} />;
        }

        // For other non-select fields, use text input with mentions
        return (
            <TextInputWithMentions
                fieldId={0} // Dummy fieldId for condition builder context
                value={value || ''}
                onChange={changeHandler}
                placeholder="Enter value or use {{variable}}"
                    dataVariables={dataVariables}
            />
        );
    };
}

export function ConditionBuilderModal(props: IConditionBuilderModalProps & { dataVariables?: Record<string, string> }) {
    const { opened, onClose, onSave, initialValue, title = "Condition Builder", dataVariables } = props;
    const { groups, languages, platforms, pages, isLoading, isError } = useConditionBuilderData();
    const [query, setQuery] = useState<RuleGroupType>(initialQuery);
    const [isSaving, setIsSaving] = useState(false);

    // Create fields with dynamic data
    const fields = createConditionFields(groups, languages, platforms, pages);

    // Memoize the control elements to prevent recreating on every render
    const controlElements = React.useMemo(() => ({
        fieldSelector: createCreatableFieldSelector(dataVariables),
        valueEditor: createSearchableValueEditor(dataVariables)
    }), [dataVariables]);    

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
            <ModalWrapper
                opened={opened}
                onClose={handleClose}
                title={title}
                size="90vw"
                onCancel={handleClose}
                cancelLabel="Close"
                modalStyles={{
                    content: { height: '90vh' },
                }}
            >
                <Alert
                    icon={<IconAlertTriangle size={16} />}
                    title="Error"
                    color="red"
                    variant="light"
                >
                    Failed to load condition builder data. Please try again.
                </Alert>
            </ModalWrapper>
        );
    }

    return (
        <ModalWrapper
            opened={opened}
            onClose={handleClose}
            title={title}
            size="90vw"
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isSaving}
            saveLabel="Save Condition"
            cancelLabel="Cancel"
            disabled={isLoading}
            closeOnClickOutside={false}
            closeOnEscape={false}
            scrollAreaHeight="70vh"
            modalStyles={{
                content: { height: '90vh' },
            }}
        >
            <LoadingOverlay visible={isLoading} />

            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Build conditions using the query builder below. Use AND/OR for groups.
                </Text>
                <div className="validateQuery">
                    <QueryBuilderMantine>
                        <QueryBuilder
                            fields={fields}
                            query={query}
                            onQueryChange={setQuery}
                            validator={defaultValidator}
                            controlElements={controlElements}
                            controlClassnames={{
                                queryBuilder: 'queryBuilder-justified queryBuilder-branches',
                                ruleGroup: 'ruleGroup',
                                rule: 'rule',
                                addRule: 'addRule modal-high-z',
                                addGroup: 'addGroup modal-high-z',
                                cloneRule: 'cloneRule modal-high-z',
                                cloneGroup: 'cloneGroup modal-high-z',
                                removeRule: 'removeRule modal-high-z',
                                removeGroup: 'removeGroup modal-high-z'
                            }}
                            resetOnFieldChange={false}
                        />
                    </QueryBuilderMantine>
                </div>
            </Stack>
        </ModalWrapper>
    );
}