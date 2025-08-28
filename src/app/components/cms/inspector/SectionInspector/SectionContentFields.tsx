'use client';

import { memo } from 'react';
import { CollapsibleInspector } from '../shared/CollapsibleInspector';
import { InspectorFields, TMinimalForm } from '../shared/InspectorFields';
import { INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../store/inspectorStore';
import { ILanguage } from '../../../../../types/responses/admin/languages.types';
import { IFieldData } from '../../shared/field-renderer/FieldRenderer';
import { ISectionField } from '../../../../../types/responses/admin/admin.types';

interface ISectionContentFieldsProps {
    contentFields: (ISectionField | IFieldData)[];
    languages: ILanguage[];
    fieldValues: Record<string, Record<number, string>>;
    onFieldChange: (fieldName: string, languageId: number | null, value: string | boolean) => void;
    className?: string;
    form?: TMinimalForm;
}

export const SectionContentFields = memo<ISectionContentFieldsProps>(
    function SectionContentFields({
        contentFields,
        languages,
        fieldValues,
        onFieldChange,
        form,
        className
    }) {
        // Only show content fields section if there are content fields
        if (contentFields.length === 0) {
            return null;
        }

        // Normalize to IFieldData for FieldRenderer
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
                title="Content"
                inspectorType={INSPECTOR_TYPES.SECTION}
                sectionName={INSPECTOR_SECTIONS.CONTENT}
                defaultExpanded={true}
            >
                <InspectorFields
                    title=""
                    fields={contentFields.map(toFieldData)}
                    languages={languages}
                    fieldValues={fieldValues}
                    onFieldChange={onFieldChange}
                    isMultiLanguage={true}
                    className={className}
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName={INSPECTOR_SECTIONS.CONTENT}
                    form={form}
                />
            </CollapsibleInspector>
        );
    },
    // Custom comparison - only re-render if content fields or values change
    (prevProps, nextProps) => {
        // Re-render if field values have changed
        if (JSON.stringify(prevProps.fieldValues) !== JSON.stringify(nextProps.fieldValues)) {
            return false;
        }

        // Check if field arrays have the same length
        if (prevProps.contentFields.length !== nextProps.contentFields.length) {
            return false;
        }

        // Check if any field IDs have changed
        const fieldsChanged = prevProps.contentFields.some((field, index) => {
            const nextField = nextProps.contentFields[index];
            return !nextField || field.id !== nextField.id;
        });

        if (fieldsChanged) {
            return false;
        }

        // If all checks pass, props are equal, so we can skip re-rendering
        return true;
    }
);
