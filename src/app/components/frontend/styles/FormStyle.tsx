/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import BasicStyle from './BasicStyle';
import { Button, Alert, LoadingOverlay, Group, Modal, Stack, Text, Title } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { usePageContentValue } from '../../../../hooks/usePageContentValue';
import { useSubmitFormMutation, useUpdateFormMutation } from '../../../../hooks/useFormSubmission';
import { usePageModal } from '../../contexts/PageModalContext';
import { REACT_QUERY_CONFIG } from '../../../../config/react-query.config';
import { type IFileInputStyleRef } from './mantine/inputs/FileInputStyle';
import { type IFormLogStyle, type IFormRecordStyle, type IEntryRecordFormStyle } from '../../../../types/common/styles.types';
import { sanitizeHtmlForInline, stripHtmlTags } from '../../../../utils/html-sanitizer.utils';
import parse from 'html-react-parser';

/** A single translatable value entry for a record-form field. */
type TFormTranslatedValue = { language_id: number; value: string };
/** Value of a record-form field: a plain string or per-language entries. */
type TFormFieldValue = string | TFormTranslatedValue[];
/** All fields of a single form record keyed by field name. */
type TFormRecordGroup = Record<string, TFormFieldValue>;

interface FormStyleProps {
    style: IFormLogStyle | IFormRecordStyle | IEntryRecordFormStyle;
    styleProps: Record<string, unknown>;
    cssClass: string;
}

/**
 * Context for sharing FileInput registration function with child components
 */
const FileInputRegistrationContext = React.createContext<{
    registerFileInputRef: (fieldName: string, ref: IFileInputStyleRef | null) => void;
} | null>(null);

/**
 * Context for sharing form field values with child components
 */
const FormFieldValueContext = React.createContext<{
    getFieldValue: (fieldName: string) => string | Array<{ language_id: number; value: string }> | null;
} | null>(null);

export { FileInputRegistrationContext, FormFieldValueContext };

const FormStyle: React.FC<FormStyleProps> = ({ style, cssClass }) => {
    const pageContent = usePageContentValue();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { inModal, closeModal } = usePageModal();
    const [formKey, setFormKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);
    const fileInputRefs = useRef<Map<string, IFileInputStyleRef>>(new Map());
    const hasInitializedForm = useRef<boolean>(false);
    const confirmedRef = useRef<boolean>(false);

    // Extract form configuration from style
    const _name = style.name?.content || 'default_form';
    const recordStyle = style as IFormRecordStyle;
    const formTitle = style.title?.content;
    const formDescription = style.description?.content;
    const alertSuccess = style.alert_success?.content;
    const alertError = style.alert_error?.content;
    const alertSuccessTitle = style.alert_success_title?.content || 'Success';
    const alertErrorTitle = style.alert_error_title?.content || 'Error';
    const confirmSubmit = style.confirm_submit?.content === '1';
    const confirmMessage = style.confirm_message?.content || 'Are you sure you want to submit?';
    // CMS-in-CMS modal flow (web-only): close the surrounding modal and/or
    // redirect after a successful save. Both come from form section fields.
    const closeModalOnSave = style.close_modal_on_save?.content === '1';
    const redirectOnSave = style.redirect_on_save?.content?.trim() || '';

    // Extract button configuration (btn_update_label/btn_update_color are record-only)
    const saveLabel = style.btn_save_label?.content || 'Save';
    const updateLabel = recordStyle.btn_update_label?.content || saveLabel || 'Update';
    const cancelLabel = style.btn_cancel_label?.content;
    const cancelUrl = style.btn_cancel_url?.content;

    // Extract button styling
    const buttonSize = style.buttons_size?.content || 'sm';
    const buttonRadius = style.buttons_radius?.content || 'sm';
    const buttonVariant = style.buttons_variant?.content || 'filled';
    const buttonPosition = style.buttons_position?.content || 'space-between';
    const buttonsOrder = style.buttons_order?.content || 'save-cancel';
    const saveColor = style.btn_save_color?.content || 'blue';
    const updateColor = recordStyle.btn_update_color?.content || saveColor || 'orange';
    const cancelColor = style.btn_cancel_color?.content || 'gray';
    
    // Get form ID from style - now directly available as number

    const sectionId = style.id;

    // Get current page ID from context
    const pageId = pageContent?.id;

    // Determine form behavior based on style name
    const isRecord = style.style_name === 'form-record' || style.style_name === 'entry-record-form';
    const isLogType = style.style_name === 'form-log';

    // React Query hooks
    const submitFormMutation = useSubmitFormMutation();
    const updateFormMutation = useUpdateFormMutation();
    
    // For record types, derive existing data from section_data of this style
    const { existingRecordId, existingFormDataFromSection } = useMemo(() => {
        if (!isRecord) return { existingRecordId: null as number | null, existingFormDataFromSection: null as TFormRecordGroup | null };

        // The record form's section_data lives on the parent form style (`style.section_data`)
        // and contains records with translations for different languages.
        const sectionDataArray = style.section_data as Array<Record<string, unknown>> | undefined;
        if (!Array.isArray(sectionDataArray) || sectionDataArray.length === 0) {
            return { existingRecordId: null, existingFormDataFromSection: null };
        }

        // Group data by record_id
        const recordGroups: Record<number, TFormRecordGroup> = {};

        sectionDataArray.forEach((record) => {
            const recordId = record.record_id as number | undefined;
            if (!recordId) return;

            if (!recordGroups[recordId]) {
                recordGroups[recordId] = {};
            }

            // For each field in the record (excluding metadata fields)
            Object.entries(record).forEach(([fieldName, fieldValue]) => {
                // Skip metadata fields that are not form data
                const skipFields = ['record_id', 'entry_date', 'id_users', 'user_name', 'user_code', 'id_actionTriggerTypes', 'triggerType', 'id_languages', 'language_locale', 'language_name'];
                if (skipFields.includes(fieldName)) return;

                const languageId = record.id_languages as number | undefined;
                const value = fieldValue as string;

                // Check if this field is translatable by looking at the child components
                const childComponent = style.children?.find((child) => (child as { name?: { content?: string } }).name?.content === fieldName);
                const isTranslatable = (childComponent as { translatable?: { content?: string } } | undefined)?.translatable?.content === '1';

                if (isTranslatable) {
                    // Language id 1 = "all" / Independent — used by sample imports and
                    // non-translated writes. LanguageTabsWrapper expands a plain
                    // string across DE/EN tabs, so keep lang-1 as a string seed until
                    // a real public-language value appears.
                    if (languageId === 1) {
                        if (!recordGroups[recordId][fieldName]) {
                            recordGroups[recordId][fieldName] = value;
                        }
                    } else {
                        const current = recordGroups[recordId][fieldName];
                        if (typeof current === 'string' || !current) {
                            // Promote seed string → per-language array; seed this locale
                            // from the explicit value (seed remains available via string
                            // promote only when no public rows existed yet).
                            recordGroups[recordId][fieldName] = [
                                { language_id: languageId as number, value },
                            ];
                        } else {
                            const langValues = current as TFormTranslatedValue[];
                            const existingIndex = langValues.findIndex((v) => v.language_id === languageId);
                            if (existingIndex >= 0) {
                                langValues[existingIndex] = { language_id: languageId as number, value };
                            } else {
                                langValues.push({ language_id: languageId as number, value });
                            }
                        }
                    }
                } else {
                    // For non-translatable fields, use value from language_id: 1 (or any language if 1 is not available)
                    if (languageId === 1 || !recordGroups[recordId][fieldName]) {
                        recordGroups[recordId][fieldName] = value;
                    }
                }
            });
        });

        // Get the first record group (assuming single record forms)
        const firstRecordId = Object.keys(recordGroups)[0];
        if (!firstRecordId) return { existingRecordId: null, existingFormDataFromSection: null };

        const recordId = parseInt(firstRecordId);
        const formData = recordGroups[recordId];

        return { existingRecordId: recordId, existingFormDataFromSection: formData };
    }, [isRecord, style]);

    // Function to collect files from all FileInput components
    const collectFilesFromInputs = useCallback((): Record<string, File[]> => {
        const filesData: Record<string, File[]> = {};
        
        fileInputRefs.current.forEach((fileInputRef, fieldName) => {
            const files = fileInputRef.getSelectedFiles();
            if (files.length > 0) {
                filesData[fieldName] = files;
            }
        });
        
        return filesData;
    }, []);

    // Function to register FileInput refs
    const registerFileInputRef = useCallback((fieldName: string, ref: IFileInputStyleRef | null) => {
        if (ref) {
            fileInputRefs.current.set(fieldName, ref);
        } else {
            fileInputRefs.current.delete(fieldName);
        }
    }, []);

    const validateForm = useCallback((formElement: HTMLFormElement): string | null => {
        const requiredFields = formElement.querySelectorAll('[required]');
        const missingFields: string[] = [];

        requiredFields.forEach((field) => {
            const input = field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            if (!input.value.trim()) {
                const label = input.getAttribute('placeholder') || input.name || 'Field';
                missingFields.push(label);
            }
        });

        if (missingFields.length > 0) {
            return `Please fill in the following required fields: ${missingFields.join(', ')}`;
        }

        // Additional validation for email fields
        const emailFields = formElement.querySelectorAll('input[type="email"]');
        const invalidEmails: string[] = [];

        emailFields.forEach((field) => {
            const input = field as HTMLInputElement;
            if (input.value && !input.checkValidity()) {
                const label = input.getAttribute('placeholder') || input.name || 'Email';
                invalidEmails.push(label);
            }
        });

        if (invalidEmails.length > 0) {
            return `Please enter valid email addresses for: ${invalidEmails.join(', ')}`;
        }

        return null;
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Optional confirm-before-submit gate. When enabled, the first submit opens
        // the dialog; confirming sets confirmedRef and re-requests the form submit.
        if (confirmSubmit && !confirmedRef.current) {
            setConfirmOpen(true);
            return;
        }
        confirmedRef.current = false;

        const formElement = e.target as HTMLFormElement;
        
        // Validate form
        const validationError = validateForm(formElement);
        if (validationError) {
            setSubmitError(validationError);
            return;
        }
        
        if (!pageId) {
            setSubmitError('Page ID is required for form submission');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        const formData = new FormData(formElement);
        
        // Collect files from FileInput components
        const filesData = collectFilesFromInputs();
        
        // Create clean FormData with only user-defined fields
        const cleanFormData = new FormData();
        
        // Add only non-internal fields from the original form
        for (const [key, value] of formData.entries()) {
            // Skip internal fields and section-* fields
            if (key === '__id_sections' || 
                key === 'section_id' || 
                key === 'page_id' || 
                key === 'record_id' ||
                key.startsWith('section-')) {
                continue;
            }
            
            // Skip file fields as they will be handled separately by our file collection logic
            const isFileField = Object.keys(filesData).some(fieldName => 
                key === fieldName || key === `${fieldName}[]`
            );
            if (isFileField) {
                continue;
            }
            
            // Add user-defined fields
            cleanFormData.append(key, value);
        }
        
        // Add files to clean FormData with proper field names
        Object.entries(filesData).forEach(([fieldName, files]) => {
            if (files.length === 1) {
                // Single file: add as single file
                cleanFormData.append(fieldName, files[0]);
            } else if (files.length > 1) {
                // Multiple files: add as array
                files.forEach(file => {
                    cleanFormData.append(`${fieldName}[]`, file);
                });
            }
        });

        const formDataObject = Object.fromEntries(cleanFormData.entries());

        // Convert empty strings to null for better data handling, but keep files as-is
        const processedFormData: Record<string, string | File | null | Array<{ language_id: number; value: string }>> = {};
        Object.keys(formDataObject).forEach(key => {
            const value = formDataObject[key];
            // Keep File objects as-is, convert empty strings to null for other fields
            let processedValue: string | File | null | Array<{ language_id: number; value: string }> = (value instanceof File) ? value : (value === '' ? null : value);

            // Check if this is a JSON string representing multi-language data
            if (typeof processedValue === 'string' && processedValue.startsWith('[') && processedValue.endsWith(']')) {
                try {
                    const parsed = JSON.parse(processedValue) as unknown;
                    // If it's an array of objects with language_id and value properties, it's multi-language data
                    if (Array.isArray(parsed) && parsed.length > 0 &&
                        typeof parsed[0] === 'object' && parsed[0] !== null &&
                        'language_id' in parsed[0] && 'value' in parsed[0]) {
                        processedValue = parsed as Array<{ language_id: number; value: string }>;
                    }
                } catch {
                    // Not valid JSON, keep as string
                }
            }

            processedFormData[key] = processedValue;
        });

        try {
            let response;
            
            // Determine if we have files to send
            const hasFiles = Object.keys(filesData).length > 0;
            
            if (isRecord && existingRecordId) {
                // Update existing record
                if (hasFiles) {
                    // Send as FormData for file uploads - add required fields to clean FormData.
                    // The backend multipart branch reads the target record from the
                    // `update_based_on` JSON param (a bare `record_id` field would be
                    // treated as form data and the update would create a new row).
                    cleanFormData.append('page_id', String(pageId));
                    cleanFormData.append('section_id', String(sectionId));
                    cleanFormData.append('update_based_on', JSON.stringify({ record_id: existingRecordId }));
                    response = await updateFormMutation.mutateAsync(cleanFormData);
                } else {
                    // Send as JSON for regular data
                    response = await updateFormMutation.mutateAsync({
                        page_id: pageId,
                        section_id: sectionId,
                        form_data: processedFormData,
                        update_based_on: { record_id: existingRecordId }
                    });
                }
            } else {
                // Create new record (for both log and new record types)
                if (hasFiles) {
                    // Send as FormData for file uploads - add required fields to clean FormData
                    cleanFormData.append('page_id', String(pageId));
                    cleanFormData.append('section_id', String(sectionId));
                    response = await submitFormMutation.mutateAsync(cleanFormData);
                } else {
                    // Send as JSON for regular data
                    response = await submitFormMutation.mutateAsync({
                        page_id: pageId,
                        section_id: sectionId,
                        form_data: processedFormData
                    });
                }
            }

            setSubmitSuccess(true);
            
            // Reset form for log types, keep data for record types
            if (isLogType) {
                setFormKey(prev => prev + 1);
                // Clear files from FileInput components
                fileInputRefs.current.forEach((fileInputRef) => {
                    fileInputRef.clearFiles();
                });
            }

            // Handle success alert - prefer backend message over style message
            const _successMessage = response?.data?.message || alertSuccess;

            // CMS-in-CMS modal flow: after a successful save, refresh the page
            // content (so the underlying list shows the new/updated row) and
            // either redirect or close the surrounding modal. No-op for normal
            // standalone forms (neither field set / not in a modal).
            if (redirectOnSave || (closeModalOnSave && inModal)) {
                void queryClient.invalidateQueries({
                    queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL,
                });
                if (redirectOnSave) {
                    router.push(redirectOnSave);
                } else {
                    closeModal();
                }
            }

        } catch (error) {
            // Extract error message from API response if available
            let errorMessage = alertError || 'Failed to submit form. Please try again.';
            const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
            if (err?.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err?.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err?.message) {
                errorMessage = err.message;
            }

            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [
        validateForm,
        pageId,
        sectionId,
        isRecord,
        isLogType,
        existingRecordId,
        alertSuccess,
        alertError,
        confirmSubmit,
        submitFormMutation,
        updateFormMutation,
        collectFilesFromInputs,
        redirectOnSave,
        closeModalOnSave,
        inModal,
        closeModal,
        router,
        queryClient
    ]);

    const handleCancel = useCallback(() => {
        if (inModal) {
            closeModal();
            return;
        }
        if (cancelUrl) {
            window.location.href = cancelUrl;
            return;
        }
        window.history.back();
    }, [inModal, closeModal, cancelUrl]);

    // Helper function to render buttons in correct order
    const renderButtons = useCallback(() => {
        const cancelButton = (cancelLabel || cancelUrl) ? (
            <Button
                key="cancel"
                type="button"
                onClick={handleCancel}
                size={buttonSize}
                radius={buttonRadius}
                variant={buttonVariant}
                color={cancelColor}
                disabled={isSubmitting}
            >
                {cancelLabel || 'Cancel'}
            </Button>
        ) : null;

        const saveButton = (
            <Button
                key="save"
                type="submit"
                loading={isSubmitting}
                disabled={!pageId}
                size={buttonSize}
                radius={buttonRadius}
                variant={buttonVariant}
                color={isRecord && existingRecordId ? updateColor : saveColor}
            >
                {parse(sanitizeHtmlForInline(isRecord && existingRecordId ? updateLabel : saveLabel))}
            </Button>
        );

        // Honour buttons_order ('save-cancel' = primary first, the default).
        const ordered = buttonsOrder === 'cancel-save'
            ? [cancelButton, saveButton]
            : [saveButton, cancelButton];
        return ordered.filter(Boolean);
    }, [
        buttonSize, buttonRadius, buttonVariant, cancelColor, saveColor, updateColor,
        isSubmitting, pageId, isRecord, existingRecordId, handleCancel, cancelLabel, cancelUrl,
        updateLabel, saveLabel, buttonsOrder
    ]);

    // Function to get field value from existing form data
    const getFieldValue = useCallback((fieldName: string): string | Array<{ language_id: number; value: string }> | null => {
        if (!isRecord || !existingFormDataFromSection) return null;
        const value = existingFormDataFromSection[fieldName];
        return value !== null && value !== undefined ? value : null;
    }, [isRecord, existingFormDataFromSection]);

    useEffect(() => {
        hasInitializedForm.current = false;
    }, [existingRecordId]);

    // Pre-populate form fields for record types with existing data from section_data
    // Note: Translatable fields are handled by LanguageTabsWrapper, so we skip them here
    useEffect(() => {
        // Reset initialization flag when form key changes (form reset)
        if (hasInitializedForm.current && formKey > 0) {
            hasInitializedForm.current = false;
        }

        if (isRecord && existingFormDataFromSection && !hasInitializedForm.current) {
            const form = formRef.current as HTMLFormElement | null;
            if (form) {
                Object.entries(existingFormDataFromSection).forEach(([fieldName, value]) => {
                    // Skip translatable fields (arrays) as they are handled by LanguageTabsWrapper
                    if (Array.isArray(value)) return;

                    const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                    if (field && value !== null && value !== undefined) {
                        // File inputs reject programmatic value assignment (browsers only
                        // allow setting them to ''), so skip pre-filling them.
                        if (field instanceof HTMLInputElement && field.type === 'file') return;
                        field.value = String(value);
                        const event = new Event('change', { bubbles: true });
                        field.dispatchEvent(event);
                    }
                });

                // Inject hidden record_id if present so updates are based on it
                if (existingRecordId) {
                    let hidden = form.querySelector('input[name="record_id"]') as HTMLInputElement | null;
                    if (!hidden) {
                        hidden = document.createElement('input');
                        hidden.type = 'hidden';
                        hidden.name = 'record_id';
                        form.appendChild(hidden);
                    }
                    hidden.value = String(existingRecordId);
                }

                hasInitializedForm.current = true;
            }
        }
    }, [isRecord, existingFormDataFromSection, existingRecordId, formKey]);

    return (
        <div style={{ position: 'relative' }} className={cssClass}>
            <LoadingOverlay visible={isSubmitting} />

            {(formTitle || formDescription) && (
                <Stack gap={4} mb="md">
                    {formTitle && <Title order={3}>{parse(sanitizeHtmlForInline(formTitle))}</Title>}
                    {formDescription && <Text c="dimmed">{parse(sanitizeHtmlForInline(formDescription))}</Text>}
                </Stack>
            )}

            {submitSuccess && alertSuccess && (
                <Alert 
                    icon={<IconCheck size={16} />} 
                    title={alertSuccessTitle} 
                    color="green" 
                    mb="md"
                    onClose={() => setSubmitSuccess(false)}
                    withCloseButton
                >
                    {alertSuccess}
                </Alert>
            )}

            {submitError && (
                <Alert 
                    icon={<IconAlertCircle size={16} />} 
                    title={alertErrorTitle} 
                    color="red" 
                    mb="md"
                    onClose={() => setSubmitError(null)}
                    withCloseButton
                >
                    {submitError}
                </Alert>
            )}

            

            {/*
              `suppressHydrationWarning` — browser autofill / password-manager
              extensions (SharkID, Bitwarden, Dashlane, 1Password, …) mutate
              form inputs *before* React hydrates: they inject attributes
              (`data-sharkid`, `data-sharklabel`, `data-bitwarden-watching`)
              onto the input itself and sibling nodes like
              `<shark-icon-container>` beside it. The resulting DOM no
              longer matches the SSR HTML, so every dynamic form throws a
              "hydration mismatch" diagnostic. Scoped here to the generated
              form only — the rest of the tree still enforces strict
              hydration checks. See React's documented escape-hatch:
              https://react.dev/reference/react-dom/client/hydrateRoot#suppressing-unavoidable-hydration-mismatch-errors
            */}
            <form ref={formRef} key={`${formKey}-${existingRecordId ?? 'create'}`} onSubmit={handleSubmit} suppressHydrationWarning>
                <input type="hidden" name="__id_sections" value={style.id} />
                {isRecord && existingRecordId ? (
                    <input type="hidden" name="record_id" value={String(existingRecordId)} />
                ) : null}
                
                <FileInputRegistrationContext.Provider value={{ registerFileInputRef }}>
                    <FormFieldValueContext.Provider value={{ getFieldValue }}>
                        <div className={(style as { css?: { content?: string } }).css?.content || ''}>
                            {style.children?.map((child, index) => (
                                child ? <BasicStyle key={index} style={child} /> : null
                            ))}

                            {/* Form Buttons */}
                            <Group justify={buttonPosition as React.ComponentProps<typeof Group>['justify']} mt="xl">
                                {renderButtons()}
                            </Group>
                        </div>
                    </FormFieldValueContext.Provider>
                </FileInputRegistrationContext.Provider>
            </form>

            <Modal
                opened={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                centered
                size="sm"
                title={formTitle ? parse(sanitizeHtmlForInline(formTitle)) : undefined}
            >
                <Stack gap="md">
                    <Text>{stripHtmlTags(confirmMessage)}</Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setConfirmOpen(false)}>
                            {cancelLabel || 'Cancel'}
                        </Button>
                        <Button
                            color={isRecord && existingRecordId ? updateColor : saveColor}
                            onClick={() => {
                                confirmedRef.current = true;
                                setConfirmOpen(false);
                                formRef.current?.requestSubmit();
                            }}
                        >
                            {parse(sanitizeHtmlForInline(isRecord && existingRecordId ? updateLabel : saveLabel))}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    );
};

export default FormStyle;