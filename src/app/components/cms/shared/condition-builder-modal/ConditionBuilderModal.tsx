/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState, type ComponentProps } from 'react';
import {
    Stack,
    Text,
    LoadingOverlay,
    Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';
import { defaultValidator, QueryBuilder, type RuleGroupType, type FieldSelectorProps, type ValueEditorProps } from 'react-querybuilder';
import { MantineValueEditor, QueryBuilderMantine } from '@react-querybuilder/mantine';
import 'react-querybuilder/dist/query-builder.css';
import { ModalWrapper } from '../../../shared/common/CustomModal';
import { useConditionBuilderData } from '../../../../../hooks/useConditionBuilderData';
import { rulesToJsonLogic, jsonLogicToRules, isValidJsonLogic } from '../../../../../utils/json-logic-conversion.utils';
import { createConditionFields } from './conditionFields';
import { TextInputWithMentions } from '../field-components/TextInputWithMentions';
import { CreatableSelectField, createSelectable } from '../field-components/CreatableSelectField/CreatableSelectField';
import { QUERY_BUILDER_CONTROL_CLASSNAMES } from '../../../../../constants/querybuilder.constants';

interface IConditionBuilderModalProps {
    opened: boolean;
    onClose: () => void;
    onSave: (jsonLogic: string | null) => void;
    initialValue?: string;
    title?: string;
    dataVariables?: Record<string, string>;
}

const initialQuery: RuleGroupType = {
    combinator: 'and',
    rules: []
};

const FIELD_SELECTOR_WIDTH = '310px';

/**
 * Pure conversion of the persisted JSON-Logic string into the query-builder
 * model. Kept side-effect free so it can run during render (see the
 * "adjust state while rendering" sync in `ConditionBuilderModal`).
 */
function parseInitialValueToQuery(initialValue: string | undefined): RuleGroupType {
    if (!initialValue || initialValue.trim() === '') {
        return initialQuery;
    }

    try {
        const parsedValue = JSON.parse(initialValue);

        if (!isValidJsonLogic(parsedValue)) {
            console.warn('ConditionBuilder: Invalid JSON Logic');
            return initialQuery;
        }

        const convertedRules = jsonLogicToRules(parsedValue);
        if (convertedRules && convertedRules.rules && convertedRules.rules.length > 0) {
            return convertedRules;
        }
        return initialQuery;
    } catch (error) {
        console.error('ConditionBuilder: Error parsing initial value:', error);
        return initialQuery;
    }
}

// Custom field selector using CreatableSelectField
function CreatableFieldSelector(props: FieldSelectorProps & { onChange?: (value: string) => void }) {
    const { value, options, onChange, handleOnChange, context, ..._otherProps } = props;
    const { dataVariables } = context || {};

    // react-querybuilder might use handleOnChange instead of onChange
    const changeHandler = onChange || handleOnChange;

    if (!changeHandler) {
        return <div>Error: No change handler</div>;
    }

    // Convert react-querybuilder options to CreatableSelectField config
    const fieldConfig = {
        options: createSelectable(options),
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
function SearchableValueEditor(props: ValueEditorProps & { onChange?: (value: string) => void }) {
    const {
        value,
        values,
        onChange,
        handleOnChange,
        fieldData,
        type,
        context,
        ..._otherProps
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
            options: createSelectable(values),
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
        // @react-querybuilder/mantine hardcodes `popoverProps.withinPortal = false`
        // on its date pickers, so the calendar renders INSIDE the modal and gets
        // clipped/hidden (issue #56 condition-builder datetime z-index). It spreads
        // `extraProps` LAST onto the picker, so we override the popover to portal it
        // above the modal with a high z-index. Width also rides on `extraProps` so
        // it actually reaches the picker (top-level `style` would not).
        const dateTimeEditorProps: ComponentProps<typeof MantineValueEditor> = {
            ...props,
            extraProps: {
                popoverProps: { withinPortal: true, zIndex: 10001 },
                style: { width: FIELD_SELECTOR_WIDTH },
            },
        };
        return <MantineValueEditor {...dateTimeEditorProps} />;
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
    // Lazily seed the query so a modal that mounts already-open (data ready) is
    // initialized on the first render; the render-phase sync below handles every
    // later open/value/loaded transition (the common case: mounts closed, opens).
    const [query, setQuery] = useState<RuleGroupType>(() =>
        opened && !isLoading && !isError ? parseInitialValueToQuery(initialValue) : initialQuery,
    );
    const [isSaving, setIsSaving] = useState(false);

    // Create fields with dynamic data
    const fields = createConditionFields(groups, languages, platforms, pages);

    // Initialize the query from the initial value once the modal is open and the
    // builder data has finished loading. This is React's recommended "adjust
    // state while rendering" pattern, guarded by a previous-deps snapshot
    // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
    //
    // The guard compares ONLY primitive open/value/loaded flags (all compared by
    // value): `initialValue` is a string, the rest are booleans. It deliberately
    // never compares the groups/languages/platforms/pages objects, which
    // useConditionBuilderData rebuilds every render (its `|| {}` fallbacks) —
    // comparing those re-fired the sync every render and caused the infinite
    // setState loop. Using render-phase sync (not useEffect) also satisfies
    // react-hooks/set-state-in-effect without weakening the rule.
    const [prevSync, setPrevSync] = useState({ opened, initialValue, isLoading, isError });
    if (
        prevSync.opened !== opened ||
        prevSync.initialValue !== initialValue ||
        prevSync.isLoading !== isLoading ||
        prevSync.isError !== isError
    ) {
        setPrevSync({ opened, initialValue, isLoading, isError });
        if (opened && !isLoading && !isError) {
            setQuery(parseInitialValueToQuery(initialValue));
        }
    }

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
        } catch {

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