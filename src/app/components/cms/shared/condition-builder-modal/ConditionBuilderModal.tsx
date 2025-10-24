'use client';

import { useState, useEffect } from 'react';
import {
    Stack,
    Text,
    LoadingOverlay,
    Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';
import { defaultValidator, QueryBuilder, RuleGroupType } from 'react-querybuilder';
import { MantineValueEditor, QueryBuilderMantine } from '@react-querybuilder/mantine';
import 'react-querybuilder/dist/query-builder.css';
import { ModalWrapper } from '../../../shared/common/CustomModal';
import { useConditionBuilderData } from '../../../../../hooks/useConditionBuilderData';
import { rulesToJsonLogic, jsonLogicToRules, isValidJsonLogic } from '../../../../../utils/json-logic-conversion.utils';
import { createConditionFields } from './conditionFields';
import { TextInputWithMentions } from '../field-components/TextInputWithMentions';
import { CreatableSelectField } from '../field-components/CreatableSelectField/CreatableSelectField';
import { QUERY_BUILDER_CONTROL_CLASSNAMES } from '../../../../../constants/querybuilder.constants';

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

const FIELD_SELECTOR_WIDTH = '310px';

// Custom field selector using CreatableSelectField
function CreatableFieldSelector(props: any) {
    const { value, options, onChange, handleOnChange, context, ...otherProps } = props;
    const { dataVariables } = context || {};

    // react-querybuilder might use handleOnChange instead of onChange
    const changeHandler = onChange || handleOnChange;

    if (!changeHandler) {
        return <div>Error: No change handler</div>;
    }

    // Convert react-querybuilder options to CreatableSelectField config
    const fieldConfig = {
        options: options.map((opt: any) => ({
            value: opt.name,
            text: opt.label || opt.name
        })),
        multiSelect: false,
        creatable: true,
        searchable: true,
        separator: ' '
    };

    return (
        <div style={{ width: FIELD_SELECTOR_WIDTH}}>
            <CreatableSelectField
                fieldId={0}
                config={fieldConfig}
                value={value || ''}
                onChange={changeHandler}
                placeholder="Select field or add custom"
                searchPlaceholder="Search fields..."
                singleCreatePlaceholder="Enter custom field (e.g., {{my_var}})"
                addSingleButtonText="Add custom field"
                dataVariables={dataVariables}
                clearable={false}
            />
        </div>
    );
}

// Custom value editor using CreatableSelectField for select fields
function SearchableValueEditor(props: any) {
    const {
        value,
        values,
        onChange,
        handleOnChange,
        fieldData,
        type,
        context,
        ...otherProps
    } = props;
    const { dataVariables } = context || {};

    // react-querybuilder might use handleOnChange instead of onChange
    const changeHandler = onChange || handleOnChange;

    if (!changeHandler) {
        return <div>Error: No change handler</div>;
    }

    // Check if this is a select field with predefined values
    const isSelectType = type === 'select' || fieldData?.valueEditorType === 'select';
    if (isSelectType && values && Array.isArray(values) && values.length > 0) {
        // Use CreatableSelectField for select-type fields
        const valueConfig = {
            options: values.map((opt: any) => ({
                value: opt.name,
                text: opt.label || opt.name
            })),
            multiSelect: false,
            creatable: true,
            searchable: true,
            separator: ' '
        };

        return (
            <div style={{ width: FIELD_SELECTOR_WIDTH}}>
                <CreatableSelectField
                    fieldId={0}
                    config={valueConfig}
                    value={value || ''}
                    onChange={changeHandler}
                    placeholder="Select value or add custom"
                    searchPlaceholder="Search values..."
                    singleCreatePlaceholder="Enter custom value (e.g., {{my_var}})"
                    addSingleButtonText="Add custom value"
                    dataVariables={dataVariables}
                    clearable={false}
                />
            </div>
        );
    }

    // For date/datetime/time fields, use default MantineValueEditor
    const isDateTimeField = fieldData?.inputType === 'date' ||
        fieldData?.inputType === 'datetime-local' ||
        fieldData?.inputType === 'time';

    if (isDateTimeField) {
        return <MantineValueEditor {...props} style={{ width: FIELD_SELECTOR_WIDTH }} />;
    }

    // For other non-select fields, use simple text input with mentions
    return (
        <div style={{ width: FIELD_SELECTOR_WIDTH }}>
            <TextInputWithMentions
                fieldId={0}
                value={value || ''}
                onChange={changeHandler}
                placeholder="Enter value or use {{variable}}"
                dataVariables={dataVariables}
            />
        </div>
    );
}

export function ConditionBuilderModal({
    opened,
    onClose,
    onSave,
    initialValue,
    title = "Condition Builder",
    dataVariables
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
                        console.warn('ConditionBuilder: Invalid JSON Logic');
                        setQuery(initialQuery);
                    }
                } catch (error) {
                    console.error('ConditionBuilder: Error parsing initial value:', error);
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
                            controlElements={{
                                fieldSelector: CreatableFieldSelector,
                                valueEditor: SearchableValueEditor
                            }}
                            controlClassnames={QUERY_BUILDER_CONTROL_CLASSNAMES}
                            context={{ dataVariables }}
                            resetOnFieldChange={true}
                        />
                    </QueryBuilderMantine>
                </div>
            </Stack>
        </ModalWrapper>
    );
}