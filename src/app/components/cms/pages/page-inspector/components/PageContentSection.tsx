'use client';

import { memo } from 'react';
import { CollapsibleInspectorSection, ContentFieldsSection } from '../../../shared';
import { INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../../store/inspectorStore';
import { IPageField } from '../../../../../../types/responses/admin/page-details.types';
import { ILanguage } from '../../../../../../types/common/language.types';

interface IPageContentSectionProps {
    contentFields: IPageField[];
    languages: ILanguage[];
    hasMultipleLanguages: boolean;
    activeLanguageTab: string;
    onLanguageTabChange: (value: string | null) => void;
    renderField: (field: IPageField, languageId: number) => React.ReactNode;
    className?: string;
}

export const PageContentSection = memo<IPageContentSectionProps>(
    function PageContentSection({
        contentFields,
        languages,
        hasMultipleLanguages,
        activeLanguageTab,
        onLanguageTabChange,
        renderField,
        className
    }) {
        // Convert fields for ContentFieldsSection
        const convertToFieldData = (field: IPageField) => ({
            id: field.id,
            name: field.name,
            label: field.label,
            type: field.type,
            display: field.display,
            required: field.required,
            options: field.options,
            translations: field.translations
        });

        return (
            <CollapsibleInspectorSection
                title="Content"
                inspectorType={INSPECTOR_TYPES.PAGE}
                sectionName={INSPECTOR_SECTIONS.CONTENT}
                defaultExpanded={true}
            >
                <ContentFieldsSection
                    fields={contentFields.map(field => convertToFieldData(field))}
                    languages={languages}
                    hasMultipleLanguages={hasMultipleLanguages}
                    activeLanguageTab={activeLanguageTab}
                    onLanguageTabChange={onLanguageTabChange}
                    renderField={renderField}
                    className={className}
                />
            </CollapsibleInspectorSection>
        );
    },
    // Custom comparison - only re-render if content fields or language state changes
    (prevProps, nextProps) => {
        return (
            prevProps.contentFields.length === nextProps.contentFields.length &&
            prevProps.activeLanguageTab === nextProps.activeLanguageTab &&
            prevProps.hasMultipleLanguages === nextProps.hasMultipleLanguages &&
            prevProps.languages.length === nextProps.languages.length &&
            prevProps.className === nextProps.className &&
            // Check if any content field has changed
            prevProps.contentFields.every((field, index) => {
                const nextField = nextProps.contentFields[index];
                return field && nextField && field.id === nextField.id;
            })
        );
    }
);
