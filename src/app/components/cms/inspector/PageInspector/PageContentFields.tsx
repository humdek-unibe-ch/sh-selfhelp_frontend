'use client';

import { memo } from 'react';
import { CollapsibleInspector } from '../shared/CollapsibleInspector';
import { InspectorFields, TMinimalForm } from '../shared/InspectorFields';
import { INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../store/inspectorStore';
import { IPageField } from '../../../../../types/responses/admin/page-details.types';
import { ILanguage } from '../../../../../types/responses/admin/languages.types';


interface IPageContentFieldsProps {
    contentFields: IPageField[];
    languages: ILanguage[];
    fieldValues?: Record<string, Record<number, string>>;
    onFieldChange?: (fieldName: string, languageId: number, value: string) => void;
    form?: TMinimalForm;
    className?: string;
}

export const PageContentFields = memo<IPageContentFieldsProps>(
    function PageContentFields({
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

        // Use the field data directly from API response
        const convertToFieldData = (field: IPageField) => ({
            id: field.id,
            name: field.name,
            title: field.title,
            type: field.type,
            default_value: field.default_value ?? '',
            help: field.help ?? '',
            disabled: false,
            hidden: 0,
            display: field.display,
            translations: field.translations || [],
            fieldConfig: field.fieldConfig
        });

        return (
            <CollapsibleInspector
                title="Content"
                inspectorType={INSPECTOR_TYPES.PAGE}
                sectionName={INSPECTOR_SECTIONS.CONTENT}
                defaultExpanded={true}
            >
                <InspectorFields
                    title=""
                    fields={contentFields.map(convertToFieldData)}
                    languages={languages}
                    fieldValues={fieldValues}
                    onFieldChange={onFieldChange ? (name, langId, value) => {
                        if (langId !== null) {
                            onFieldChange(name, langId, String(value));
                        }
                    } : undefined}
                    form={form}
                    isMultiLanguage={true}
                    className={className}
                    inspectorType={INSPECTOR_TYPES.PAGE}
                    sectionName={INSPECTOR_SECTIONS.CONTENT}
                />
            </CollapsibleInspector>
        );
    },
    // Custom comparison - only re-render if content fields or language state changes
    (prevProps, nextProps) => {
        // Re-render if field values have changed
        if (JSON.stringify(prevProps.fieldValues) !== JSON.stringify(nextProps.fieldValues)) {
            return false;
        }

        // Check other props for equality to prevent unnecessary re-renders
        return (
            prevProps.contentFields.length === nextProps.contentFields.length &&
            prevProps.languages.length === nextProps.languages.length &&
            prevProps.className === nextProps.className &&
            prevProps.contentFields.every((field, index) => {
                const nextField = nextProps.contentFields[index];
                return field && nextField && field.id === nextField.id;
            })
        );
    }
);
