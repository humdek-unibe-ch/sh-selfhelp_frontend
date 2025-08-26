'use client';

import { memo } from 'react';
import { CollapsibleInspectorSection, FieldsSection, IFieldData } from '../../../shared';
import { INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../../store/inspectorStore';
import { ILanguage } from '../../../../../../types/common/language.types';

interface ISectionContentFieldsProps {
    contentFields: IFieldData[];
    languages: ILanguage[];
    fieldValues: Record<string, Record<number, string>>;
    onFieldChange: (fieldName: string, languageId: number, value: string) => void;
    className?: string;
}

export const SectionContentFields = memo<ISectionContentFieldsProps>(
    function SectionContentFields({
        contentFields,
        languages,
        fieldValues,
        onFieldChange,
        className
    }) {
        return (
            <CollapsibleInspectorSection
                title="Content"
                inspectorType={INSPECTOR_TYPES.SECTION}
                sectionName={INSPECTOR_SECTIONS.CONTENT}
                defaultExpanded={true}
            >
                <FieldsSection
                    title=""
                    fields={contentFields}
                    languages={languages}
                    fieldValues={fieldValues}
                    onFieldChange={onFieldChange}
                    isMultiLanguage={true}
                    className={className}
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName={INSPECTOR_SECTIONS.CONTENT}
                />
            </CollapsibleInspectorSection>
        );
    },
    // Custom comparison - only re-render if content fields or values change
    (prevProps, nextProps) => {
        // Check if field arrays have same length and same field IDs
        if (prevProps.contentFields.length !== nextProps.contentFields.length) {
            return false;
        }

        // Check if any field IDs changed
        const fieldsChanged = prevProps.contentFields.some((field, index) => {
            const nextField = nextProps.contentFields[index];
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
            const prevFieldValues = prevProps.fieldValues[fieldName] || {};
            const nextFieldValues = nextProps.fieldValues[fieldName] || {};

            const languageIds = Object.keys(prevFieldValues);
            const nextLanguageIds = Object.keys(nextFieldValues);

            if (languageIds.length !== nextLanguageIds.length) {
                return true;
            }

            return languageIds.some(langId => {
                return prevFieldValues[parseInt(langId)] !== nextFieldValues[parseInt(langId)];
            });
        });

        return !valuesChanged &&
               prevProps.languages.length === nextProps.languages.length &&
               prevProps.className === nextProps.className;
    }
);
