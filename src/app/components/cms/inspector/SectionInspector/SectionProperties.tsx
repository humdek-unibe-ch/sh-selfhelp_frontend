'use client';

import { memo } from 'react';
import { Stack } from '@mantine/core';
import { CollapsibleInspector } from '../shared/CollapsibleInspector';
import { INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../store/inspectorStore';
import { FieldRenderer, IFieldData, ILanguage } from '../../shared';
import { ISectionField } from '../../../../../types/responses/admin/admin.types';

interface ISectionPropertiesProps {
    propertyFields: (ISectionField | IFieldData)[];
    languages: ILanguage[];
    fieldValues: Record<string, string | boolean>;
    onFieldChange: (fieldName: string, value: string | boolean) => void;
    className?: string;
}

export const SectionProperties = memo<ISectionPropertiesProps>(
    function SectionProperties({
        propertyFields,
        languages,
        fieldValues,
        onFieldChange,
        className
    }) {
        // Only show properties section if there are property fields
        if (propertyFields.length === 0) {
            return null;
        }

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
                <Stack gap="md" className={className}>
                    {/* Property fields don't have language tabs as they're not translatable */}
                    {propertyFields.map(field => (
                        <FieldRenderer
                            key={field.id}
                            field={toFieldData(field)}                                    
                            languageId={1} // Property fields always use language ID 1
                            value={fieldValues[field.name]} // Pass the current form state value
                            onChange={(value) => onFieldChange(field.name, value)}
                            className={className}
                        />
                    ))}
                </Stack>
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
        const fieldNames = Object.keys(prevProps.fieldValues);
        const nextFieldNames = Object.keys(nextProps.fieldValues);

        if (fieldNames.length !== nextFieldNames.length) {
            return false;
        }

        const valuesChanged = fieldNames.some(fieldName => {
            return prevProps.fieldValues[fieldName] !== nextProps.fieldValues[fieldName];
        });

        return !valuesChanged && prevProps.className === nextProps.className;
    }
);
