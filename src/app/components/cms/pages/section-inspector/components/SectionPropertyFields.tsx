'use client';

import { memo } from 'react';
import { CollapsibleInspectorSection, FieldsSection, IFieldData } from '../../../shared';
import { INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../../store/inspectorStore';
import { ILanguage } from '../../../../../../types/common/language.types';

interface ISectionPropertyFieldsProps {
    propertyFields: IFieldData[];
    languages: ILanguage[];
    fieldValues: Record<string, string | boolean>;
    onFieldChange: (fieldName: string, value: string | boolean) => void;
    className?: string;
}

export const SectionPropertyFields = memo<ISectionPropertyFieldsProps>(
    function SectionPropertyFields({
        propertyFields,
        languages,
        fieldValues,
        onFieldChange,
        className
    }) {
        return (
            <CollapsibleInspectorSection
                title="Properties"
                inspectorType={INSPECTOR_TYPES.SECTION}
                sectionName={INSPECTOR_SECTIONS.PROPERTIES}
                defaultExpanded={true}
            >
                <FieldsSection
                    title=""
                    fields={propertyFields}
                    languages={languages}
                    fieldValues={fieldValues}
                    onFieldChange={onFieldChange}
                    isMultiLanguage={false}
                    className={className}
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName={INSPECTOR_SECTIONS.PROPERTIES}
                />
            </CollapsibleInspectorSection>
        );
    },
    // Custom comparison - only re-render if property fields or values change
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

        return !valuesChanged &&
               prevProps.languages.length === nextProps.languages.length &&
               prevProps.className === nextProps.className;
    }
);
