'use client';

import { memo } from 'react';
import { CollapsibleInspector } from '../shared/CollapsibleInspector';
import { InspectorFields } from '../shared/InspectorFields';
import { INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../store/inspectorStore';
import { IFieldData } from '../../shared';
import { ILanguage } from '../../../../../types/responses/admin/languages.types';
import { ISectionField } from '../../../../../types/responses/admin/admin.types';
import type { UseFormReturnType } from '@mantine/form';

interface ISectionPropertiesProps {
    propertyFields: (ISectionField | IFieldData)[];
    languages: ILanguage[];
    fieldValues?: Record<string, string | boolean>;
    onFieldChange?: (fieldName: string, value: string | boolean) => void;
    className?: string;
    form?: UseFormReturnType<{ fields: Record<string, Record<number, string>> }>;
}

export const SectionProperties = memo<ISectionPropertiesProps>(
    function SectionProperties({
        propertyFields,
        languages,
        fieldValues,
        onFieldChange,
        className,
        form
    }) {
        if (propertyFields.length === 0) return null;

        const toFieldData = (field: ISectionField | IFieldData): IFieldData => {
            if ((field as IFieldData).translations !== undefined) {
                return field as IFieldData;
            }
            const f = field as ISectionField;
            return {
                id: f.id,
                name: f.name,
                title: f.title || f.name,
                type: f.type,
                default_value: f.default_value ?? '',
                help: f.help ?? '',
                disabled: f.disabled,
                hidden: f.hidden,
                display: f.display,
                translations: f.translations || [],
                fieldConfig: f.fieldConfig || {}
            };
        };

        return (
            <CollapsibleInspector
                title="Properties"
                inspectorType={INSPECTOR_TYPES.SECTION}
                sectionName={INSPECTOR_SECTIONS.PROPERTIES}
                defaultExpanded={true}
            >
                <InspectorFields
                    title=""
                    fields={propertyFields.map(toFieldData)}
                    languages={languages}
                    fieldValues={fieldValues}
                    onFieldChange={onFieldChange ? (name, _langId, value) => onFieldChange(name, value) : undefined}
                    form={form}
                    isMultiLanguage={false}
                    className={className}
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName={INSPECTOR_SECTIONS.PROPERTIES}
                />
            </CollapsibleInspector>
        );
    },
    // Custom comparison for performance
    (prevProps, nextProps) => {
        // Check if field arrays have same length and same field IDs
        if (prevProps.propertyFields.length !== nextProps.propertyFields.length) {
            return false;
        }

        // Check if any field IDs changed
        const fieldsChanged = prevProps.propertyFields.some((field, index) => {
            const nextField = nextProps.propertyFields[index];
            return !nextField || field.id !== nextField.id;
        });

        if (fieldsChanged) {
            return false;
        }

        // Check if field values changed
        const prevVals = prevProps.fieldValues || {};
        const nextVals = nextProps.fieldValues || {};
        const fieldNames = Object.keys(prevVals);
        const nextFieldNames = Object.keys(nextVals);

        if (fieldNames.length !== nextFieldNames.length) {
            return false;
        }

        const valuesChanged = fieldNames.some(fieldName => {
            return prevVals[fieldName] !== nextVals[fieldName];
        });

        return !valuesChanged && prevProps.className === nextProps.className;
    }
);
