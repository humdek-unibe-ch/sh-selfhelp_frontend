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
import {
    asFilesCell,
    getFormInvalidData,
    getFormStaleVersion,
    parseFormRecordPrefill,
    type IFormFileFieldOp,
    type TFormRecordPrefillFieldValue,
} from '@selfhelp/shared';
import { usePageContentValue } from '../../../../hooks/usePageContentValue';
import { useSubmitFormMutation, useUpdateFormMutation } from '../../../../hooks/useFormSubmission';
import { usePageModal } from '../../contexts/PageModalContext';
import { REACT_QUERY_CONFIG } from '../../../../config/react-query.config';
import { type IFileInputStyleRef } from './mantine/inputs/FileInputStyle';
import { type IFormLogStyle, type IFormRecordStyle, type IEntryRecordFormStyle } from '../../../../types/common/styles.types';
import { sanitizeHtmlForInline, stripHtmlTags } from '../../../../utils/html-sanitizer.utils';
import { useFormListForm } from './form-list/FormListFormContext';
import parse from 'html-react-parser';

/** All fields of a single form record keyed by field name (shared prefill shape). */
type TFormRecordGroup = Record<string, TFormRecordPrefillFieldValue>;

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
    getFileFieldValue: (fieldName: string) => TFormRecordPrefillFieldValue | null;
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
    // The record was changed by someone else after this form read it: nothing was saved and the input is still here.
    const [staleConflict, setStaleConflict] = useState(false);
    // The version a save of this record returned last: the next save of the same page load is based on it,
    // so two quick saves in a row do not collide with each other before the page has been read again.
    const savedVersionRef = useRef<{ recordId: number; version: number } | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);
    const fileInputRefs = useRef<Map<string, IFileInputStyleRef>>(new Map());
    const hasInitializedForm = useRef<boolean>(false);
    const confirmedRef = useRef<boolean>(false);
    // Set synchronously when a submit starts. `isSubmitting` state is only
    // visible after the next render, so a double click would otherwise run the
    // handler twice and write the record twice.
    const submittingRef = useRef<boolean>(false);
    // The list that draws this form (`entry-form-list`), if any: it decides
    // which record is edited and receives the result of the save.
    const listForm = useFormListForm();
    // Unsaved-input tracking for a form inside a list (see `isDirty`).
    const dirtyBaselineRef = useRef<string | null>(null);
    const userTouchedRef = useRef<boolean>(false);

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

    // React Query hooks. Inside a list the list reads its own state again after
    // a write, so the whole page payload is not refreshed for it.
    const submitFormMutation = useSubmitFormMutation({ refreshPageContent: listForm === null });
    const updateFormMutation = useUpdateFormMutation({ refreshPageContent: listForm === null });

    const listRecordId = listForm?.recordId ?? null;
    const listPrefill = listForm?.prefill ?? null;
    const insideList = listForm !== null;

    // For record types, derive existing data from section_data of this style.
    // Inside a list the list decides: the record it opened (with the values the
    // server sent for it) or a new record, whatever style the form has and
    // whatever record the page payload would have prefilled.
    const { existingRecordId, existingFormDataFromSection, existingRecordVersion } = useMemo(() => {
        if (insideList) {
            if (listRecordId === null) {
                return { existingRecordId: null as number | null, existingFormDataFromSection: null as TFormRecordGroup | null, existingRecordVersion: null as number | null };
            }
            // List `form_values` is either language rows (array) or one row object with
            // file cells already shaped as `{ files: [...] }` (contract 4).
            const sectionData = Array.isArray(listPrefill)
                ? listPrefill
                : listPrefill && typeof listPrefill === 'object'
                  ? [{ record_id: listRecordId, id_languages: 1, ...(listPrefill as Record<string, unknown>) }]
                  : [];
            const prefill = parseFormRecordPrefill({
                section_data: sectionData,
                children: style.children as Parameters<typeof parseFormRecordPrefill>[0]['children'],
            });
            // When the server already sent a single row object, prefer it directly so
            // file cells survive even if children metadata is incomplete.
            let directValues: TFormRecordGroup | null = null;
            if (!Array.isArray(listPrefill) && listPrefill && typeof listPrefill === 'object') {
                const mapped: TFormRecordGroup = {};
                for (const [key, value] of Object.entries(listPrefill as Record<string, unknown>)) {
                    if (key === 'record_id' || key === '_version' || key === 'id_languages') {
                        continue;
                    }
                    const files = asFilesCell(value);
                    if (files !== null) {
                        mapped[key] = files;
                        continue;
                    }
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        mapped[key] = String(value);
                    }
                }
                directValues = Object.keys(mapped).length > 0 ? mapped : null;
            }
            return {
                existingRecordId: listRecordId,
                existingFormDataFromSection:
                    directValues && Object.keys(directValues).length > 0
                        ? directValues
                        : prefill.recordId === listRecordId
                          ? prefill.values
                          : null,
                // The list names the version of the record it opened (`listForm.expectedVersion`).
                existingRecordVersion: null as number | null,
            };
        }
        if (!isRecord) return { existingRecordId: null as number | null, existingFormDataFromSection: null as TFormRecordGroup | null, existingRecordVersion: null as number | null };

        const prefill = parseFormRecordPrefill({
            section_data: style.section_data as unknown,
            children: style.children as Parameters<typeof parseFormRecordPrefill>[0]['children'],
        });
        if (prefill.recordId === null) {
            return { existingRecordId: null, existingFormDataFromSection: null, existingRecordVersion: null };
        }
        return {
            existingRecordId: prefill.recordId,
            existingFormDataFromSection: prefill.values,
            // The version the page was built with: a save names it, the server refuses an old one.
            existingRecordVersion: prefill.version ?? null,
        };
    }, [isRecord, style, insideList, listRecordId, listPrefill]);

    // Whether a save updates an existing record (record forms with a record,
    // and any form a list opened on a record) or creates a new one.
    const isUpdate = existingRecordId !== null && (isRecord || insideList);

    // Serialized input of the form (values and chosen files), for `isDirty`.
    const serializeForm = useCallback((): string => {
        const form = formRef.current;
        if (!form) {
            return '';
        }
        const parts: string[] = [];
        new FormData(form).forEach((value, key) => {
            if (key === '__id_sections' || key === 'section_id' || key === 'page_id' || key === 'record_id') {
                return;
            }
            parts.push(`${key}=${value instanceof File ? `file:${value.name}:${value.size}` : String(value)}`);
        });
        fileInputRefs.current.forEach((fileInputRef, fieldName) => {
            const files = fileInputRef.getSelectedFiles();
            if (files.length > 0) {
                parts.push(`${fieldName}=files:${files.map((file) => `${file.name}:${file.size}`).join('|')}`);
            }
            const op = fileInputRef.getFileOp?.();
            if (op) {
                parts.push(`${fieldName}=file_op:${JSON.stringify(op)}`);
            }
        });
        return parts.join('\n');
    }, []);

    // The first interaction records what the form looked like before the person
    // touched it (after any prefill), so a later difference is unsaved input.
    // A real user input or change event also marks the form as touched.
    const captureDirtyBaseline = useCallback(() => {
        if (dirtyBaselineRef.current === null) {
            dirtyBaselineRef.current = serializeForm();
        }
    }, [serializeForm]);

    const markUserTouched = useCallback((event: React.SyntheticEvent) => {
        if (event.nativeEvent.isTrusted) {
            userTouchedRef.current = true;
        }
    }, []);

    const isDirty = useCallback((): boolean => {
        if (userTouchedRef.current) {
            return true;
        }
        return dirtyBaselineRef.current !== null && serializeForm() !== dirtyBaselineRef.current;
    }, [serializeForm]);

    const registerDirtyCheck = listForm?.registerDirtyCheck;
    useEffect(() => {
        if (!registerDirtyCheck) {
            return undefined;
        }
        registerDirtyCheck(isDirty);
        return () => registerDirtyCheck(null);
    }, [registerDirtyCheck, isDirty]);

    // A different record (or a new one) is a different form: forget the old baseline.
    useEffect(() => {
        dirtyBaselineRef.current = null;
        userTouchedRef.current = false;
    }, [existingRecordId, formKey]);

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
            // FileInput's button has no value; checked via refs below.
            if (field instanceof HTMLButtonElement) return;
            const input = field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            if (!input.value.trim()) {
                // Prefer the visible label (minus the required asterisk) over a placeholder.
                const labelText = input.labels?.[0]?.textContent?.replace(/\s*\*\s*$/, '').trim();
                const label = labelText || input.getAttribute('placeholder') || input.name || 'Field';
                missingFields.push(label);
            }
        });

        fileInputRefs.current.forEach((fileInputRef) => {
            if (!fileInputRef.isRequired()) {
                return;
            }
            const hasNew = fileInputRef.getSelectedFiles().length > 0;
            const hasKept = (fileInputRef.getKeptExistingCount?.() ?? 0) > 0;
            if (!hasNew && !hasKept) {
                missingFields.push(fileInputRef.getLabel());
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

        // One write per interaction: a second submit while one is in flight
        // (double click, Enter held down) is ignored, not queued.
        if (submittingRef.current) {
            return;
        }

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

        submittingRef.current = true;
        setIsSubmitting(true);
        setSubmitError(null);
        setStaleConflict(false);
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

        // Contract 4: explicit remove / remove_indexes on update (omit = keep).
        // Multipart: the JSON string lands in the request bag; UploadedFile parts
        // stay in the files bag (Symfony keeps them separate even under the same name).
        const fileOps: Record<string, IFormFileFieldOp> = {};
        fileInputRefs.current.forEach((fileInputRef, fieldName) => {
            const op = fileInputRef.getFileOp?.();
            if (!op) {
                return;
            }
            fileOps[fieldName] = op;
            cleanFormData.append(fieldName, JSON.stringify(op));
        });

        const formDataObject = Object.fromEntries(cleanFormData.entries());

        // Convert empty strings to null for better data handling, but keep files as-is
        const processedFormData: Record<string, string | File | null | Array<{ language_id: number; value: string }>> = {};
        Object.keys(formDataObject).forEach(key => {
            const value = formDataObject[key];
            // An empty file part is a file input nobody picked a file for: it has no value to send. As JSON
            // it would become `{}`, which the server accepts only for field names that contain "file", and
            // an edit would be refused ("must contain a scalar value"). The stored file stays as it is.
            if (value instanceof File && value.size === 0 && value.name === '') {
                return;
            }
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

        // File ops as objects for the JSON update body (multipart already appended strings).
        Object.entries(fileOps).forEach(([fieldName, op]) => {
            if (!(fieldName in processedFormData) || typeof processedFormData[fieldName] === 'string') {
                processedFormData[fieldName] = op as unknown as string;
            }
        });

        try {
            let response;
            
            // Determine if we have files to send
            const hasFiles = Object.keys(filesData).length > 0;
            
            // The version the person started from, sent back so the server can
            // refuse the save when somebody else changed the record meanwhile. A list names the
            // version of the record it opened; a record form the version its page was built with,
            // or the one the last save of this record returned when that is newer.
            const offeredVersion = listForm?.expectedVersion ?? existingRecordVersion;
            const lastSaved = savedVersionRef.current;
            const expectedVersion = isUpdate
                ? (lastSaved !== null && lastSaved.recordId === existingRecordId && lastSaved.version > (offeredVersion ?? 0)
                    ? lastSaved.version
                    : offeredVersion)
                : null;

            if (isUpdate && existingRecordId) {
                // The server refuses an update that names no version. A page that offered none (an
                // older server) cannot be saved from: say so instead of sending a request that fails.
                if (expectedVersion === null) {
                    setSubmitError('This entry cannot be saved because the page did not say which version of it you are editing. Reload the page and try again.');
                    return;
                }

                // Update existing record
                if (hasFiles) {
                    // Send as FormData for file uploads - add required fields to clean FormData.
                    // The backend multipart branch reads the target record from the
                    // `update_based_on` JSON param (a bare `record_id` field would be
                    // treated as form data and the update would create a new row).
                    cleanFormData.append('page_id', String(pageId));
                    cleanFormData.append('section_id', String(sectionId));
                    cleanFormData.append('update_based_on', JSON.stringify({ record_id: existingRecordId }));
                    cleanFormData.append('expected_version', String(expectedVersion));
                    response = await updateFormMutation.mutateAsync(cleanFormData);
                } else {
                    // Send as JSON for regular data
                    response = await updateFormMutation.mutateAsync({
                        page_id: pageId,
                        section_id: sectionId,
                        form_data: processedFormData,
                        update_based_on: { record_id: existingRecordId },
                        expected_version: expectedVersion,
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

            const savedResult = (response as { data?: { record_id?: number; version?: number } } | undefined)?.data;
            if (isUpdate && existingRecordId !== null && typeof savedResult?.version === 'number') {
                savedVersionRef.current = { recordId: existingRecordId, version: savedResult.version };
            }

            // Inside a list the list owns what happens next: it closes the dialog,
            // refreshes its rows and says the entry was saved. No alert, reset,
            // redirect or page-modal close of the form's own.
            if (listForm) {
                const saved = savedResult;
                listForm.onSaved({
                    recordId: saved?.record_id ?? existingRecordId,
                    version: typeof saved?.version === 'number' ? saved.version : null,
                    created: !isUpdate,
                });
                return;
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
            // Someone else changed the record since it was opened: nothing was
            // written. The list shows the conflict; the draft stays in the form.
            const stale = getFormStaleVersion(error);
            if (stale !== null && listForm) {
                listForm.onStale(stale);
                return;
            }
            if (stale !== null) {
                // A record form on a page: nothing was written and the input stays in the form. The
                // person decides, so the page is not read again behind their back.
                setStaleConflict(true);
                return;
            }

            // A value that breaks the rules of the form: name every problem, nothing was saved.
            const invalid = getFormInvalidData(error);
            if (invalid !== null) {
                setSubmitError(invalid.errors.map((entry) => entry.message).join(' '));
                return;
            }

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
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    }, [
        validateForm,
        pageId,
        sectionId,
        isLogType,
        isUpdate,
        listForm,
        existingRecordId,
        existingRecordVersion,
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
        // A list closes its own dialog (and asks first when input would be lost).
        if (listForm) {
            listForm.onCancel();
            return;
        }
        if (inModal) {
            closeModal();
            return;
        }
        if (cancelUrl) {
            window.location.href = cancelUrl;
            return;
        }
        window.history.back();
    }, [listForm, inModal, closeModal, cancelUrl]);

    // Helper function to render buttons in correct order
    const renderButtons = useCallback(() => {
        // A form inside a list always offers Cancel: it is how a person leaves the dialog.
        const cancelButton = (cancelLabel || cancelUrl || insideList) ? (
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
                color={isUpdate ? updateColor : saveColor}
            >
                {parse(sanitizeHtmlForInline(isUpdate ? updateLabel : saveLabel))}
            </Button>
        );

        // Honour buttons_order ('save-cancel' = primary first, the default).
        const ordered = buttonsOrder === 'cancel-save'
            ? [cancelButton, saveButton]
            : [saveButton, cancelButton];
        return ordered.filter(Boolean);
    }, [
        buttonSize, buttonRadius, buttonVariant, cancelColor, saveColor, updateColor,
        isSubmitting, pageId, isUpdate, insideList, handleCancel, cancelLabel, cancelUrl,
        updateLabel, saveLabel, buttonsOrder
    ]);

    // Function to get field value from existing form data
    const getFieldValue = useCallback((fieldName: string): string | Array<{ language_id: number; value: string }> | null => {
        if ((!isRecord && !insideList) || !existingFormDataFromSection) return null;
        const value = existingFormDataFromSection[fieldName];
        if (value === null || value === undefined) return null;
        if (typeof value === 'string' || Array.isArray(value)) return value;
        return null;
    }, [isRecord, insideList, existingFormDataFromSection]);

    const getFileFieldValue = useCallback((fieldName: string): TFormRecordPrefillFieldValue | null => {
        if ((!isRecord && !insideList) || !existingFormDataFromSection) return null;
        const value = existingFormDataFromSection[fieldName];
        return value !== null && value !== undefined ? value : null;
    }, [isRecord, insideList, existingFormDataFromSection]);

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

        if ((isRecord || insideList) && existingFormDataFromSection && !hasInitializedForm.current) {
            const form = formRef.current as HTMLFormElement | null;
            if (form) {
                Object.entries(existingFormDataFromSection).forEach(([fieldName, value]) => {
                    // Skip translatable fields (arrays) as they are handled by LanguageTabsWrapper
                    if (Array.isArray(value)) return;
                    // File cells are drawn by FileInputStyle from FormFieldValueContext.
                    if (value && typeof value === 'object' && 'files' in value) return;

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
    }, [isRecord, insideList, existingFormDataFromSection, existingRecordId, formKey]);

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

            {staleConflict && (
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="This entry was changed"
                    color="yellow"
                    mb="md"
                    role="alert"
                    data-testid="form-stale-conflict"
                    onClose={() => setStaleConflict(false)}
                    withCloseButton
                >
                    <Stack gap="xs">
                        <Text size="sm">
                            Someone else changed this entry after you opened it, so your changes were not saved. What you typed is
                            still in the form. Copy it if you want to keep it, then reload the page to see the current version.
                        </Text>
                        <Group>
                            <Button size="xs" variant="light" color="yellow" type="button" onClick={() => window.location.reload()}>
                                Reload the page
                            </Button>
                        </Group>
                    </Stack>
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
            <form
                ref={formRef}
                key={`${formKey}-${existingRecordId ?? 'create'}`}
                onSubmit={handleSubmit}
                onFocusCapture={insideList ? captureDirtyBaseline : undefined}
                onPointerDownCapture={insideList ? captureDirtyBaseline : undefined}
                onKeyDownCapture={insideList ? captureDirtyBaseline : undefined}
                onInputCapture={insideList ? markUserTouched : undefined}
                onChangeCapture={insideList ? markUserTouched : undefined}
                suppressHydrationWarning
            >
                <input type="hidden" name="__id_sections" value={style.id} />
                {isUpdate && existingRecordId ? (
                    <input type="hidden" name="record_id" value={String(existingRecordId)} />
                ) : null}
                
                <FileInputRegistrationContext.Provider value={{ registerFileInputRef }}>
                    <FormFieldValueContext.Provider value={{ getFieldValue, getFileFieldValue }}>
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
                            color={isUpdate ? updateColor : saveColor}
                            onClick={() => {
                                confirmedRef.current = true;
                                setConfirmOpen(false);
                                formRef.current?.requestSubmit();
                            }}
                        >
                            {parse(sanitizeHtmlForInline(isUpdate ? updateLabel : saveLabel))}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    );
};

export default FormStyle;