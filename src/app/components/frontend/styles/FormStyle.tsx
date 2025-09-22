import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import BasicStyle from './BasicStyle';
import { Button, Alert, LoadingOverlay, Group } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { usePageContentContext } from '../../contexts/PageContentContext';
import { useSubmitFormMutation, useUpdateFormMutation } from '../../../../hooks/useFormSubmission';
import { getFieldContent } from '../../../../utils/style-field-extractor';
import { IFileInputStyleRef } from './mantine/inputs/FileInputStyle';
import { IFormLogStyle, IFormRecordStyle } from '../../../../types/common/styles.types';

interface FormStyleProps {
    style: IFormLogStyle | IFormRecordStyle;
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
    getFieldValue: (fieldName: string) => string | null;
} | null>(null);

export { FileInputRegistrationContext, FormFieldValueContext };

const FormStyle: React.FC<FormStyleProps> = ({ style }) => {
    const { pageContent } = usePageContentContext();
    const [formKey, setFormKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);
    const fileInputRefs = useRef<Map<string, IFileInputStyleRef>>(new Map());

    // Extract form configuration from style
    const name = getFieldContent(style, 'name') || 'default_form';
    const isLog = getFieldContent(style, 'is_log') === '1';
    const alertSuccess = getFieldContent(style, 'alert_success');
    const alertError = getFieldContent(style, 'alert_error');
    const redirectUrl = getFieldContent(style, 'redirect_at_end');
    const buttonLabel = getFieldContent(style, 'label') || 'Submit';

    // Extract button configuration
    const saveLabel = getFieldContent(style, 'btn_save_label') || 'Save';
    const updateLabel = getFieldContent(style, 'btn_update_label') || 'Update';
    const cancelLabel = getFieldContent(style, 'btn_cancel_label');
    const cancelUrl = getFieldContent(style, 'btn_cancel_url');

    // Extract Mantine button styling
    const useMantineStyle = getFieldContent(style, 'use_mantine_style') === '1';
    const buttonSize = getFieldContent(style, 'mantine_buttons_size') || 'sm';
    const buttonRadius = getFieldContent(style, 'mantine_buttons_radius') || 'sm';
    const buttonVariant = getFieldContent(style, 'mantine_buttons_variant') || 'filled';
    const buttonPosition = getFieldContent(style, 'mantine_buttons_position') || 'space-between';
    const buttonOrder = getFieldContent(style, 'mantine_buttons_order') || 'cancel-save';
    const saveColor = getFieldContent(style, 'mantine_btn_save_color') || 'blue';
    const updateColor = getFieldContent(style, 'mantine_btn_update_color') || 'green';
    const cancelColor = getFieldContent(style, 'mantine_btn_cancel_color') || 'gray';
    
    // Get form ID from style - now directly available as number

    const sectionId = style.id;

    // Get current page ID from context
    const pageId = pageContent?.id;

    // Determine form behavior based on style name
    const isRecord = style.style_name === 'form-record';
    const isLogType = style.style_name === 'form-log' || isLog;

    // React Query hooks
    const submitFormMutation = useSubmitFormMutation();
    const updateFormMutation = useUpdateFormMutation();

    console.log('style', style);

    console.log('section_data',JSON.stringify(style.section_data));
    
    // For record types, derive existing data from section_data of this style
    const { existingRecordId, existingFormDataFromSection } = useMemo(() => {
        if (!isRecord) return { existingRecordId: null as number | null, existingFormDataFromSection: null as Record<string, any> | null };

        // The record form's section_data lives on the parent form style (`style.section_data`)
        // and contains key-value pairs where keys match input names inside the form.
        const sectionDataArray: any[] | undefined = (style as any).section_data;
        const firstRecord = Array.isArray(sectionDataArray) && sectionDataArray.length > 0 ? sectionDataArray[0] : null;

        if (!firstRecord) return { existingRecordId: null, existingFormDataFromSection: null };

        const { record_id, ...rest } = firstRecord as Record<string, any>;
        return { existingRecordId: record_id ?? null, existingFormDataFromSection: rest };
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
        const processedFormData: Record<string, any> = {};
        Object.keys(formDataObject).forEach(key => {
            const value = formDataObject[key];
            // Keep File objects as-is, convert empty strings to null for other fields
            processedFormData[key] = (value instanceof File) ? value : (value === '' ? null : value);
        });

        try {
            let response;
            
            // Determine if we have files to send
            const hasFiles = Object.keys(filesData).length > 0;
            
            if (isRecord && existingRecordId) {
                // Update existing record
                if (hasFiles) {
                    // Send as FormData for file uploads - add required fields to clean FormData
                    cleanFormData.append('page_id', String(pageId));
                    cleanFormData.append('section_id', String(sectionId));
                    cleanFormData.append('record_id', String(existingRecordId));
                    response = await updateFormMutation.mutateAsync(cleanFormData as any);
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
                    response = await submitFormMutation.mutateAsync(cleanFormData as any);
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
            const successMessage = response?.data?.message || alertSuccess;

        } catch (error: any) {
            // Extract error message from API response if available
            let errorMessage = alertError || 'Failed to submit form. Please try again.';
            if (error?.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
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
        redirectUrl,
        submitFormMutation,
        updateFormMutation,
        collectFilesFromInputs
    ]);

    const handleCancel = useCallback(() => {
        if (cancelUrl) {
            window.location.href = cancelUrl;
        } else {
            // Default cancel behavior - could go back or stay on page
            window.history.back();
        }
    }, [cancelUrl]);

    // Helper function to render buttons in correct order
    const renderButtons = useCallback((isMantine: boolean) => {
        const cancelButton = (cancelUrl) && (
            isMantine ? (
                <Button
                    key="cancel"
                    type="button"
                    onClick={handleCancel}
                    size={buttonSize}
                    radius={buttonRadius}
                    variant={buttonVariant as any}
                    color={cancelColor}
                    disabled={isSubmitting}
                >
                    {cancelLabel}
                </Button>
            ) : (
                <button
                    key="cancel"
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    style={{
                        padding: buttonSize === 'xs' ? '0.25rem 0.5rem' :
                                buttonSize === 'sm' ? '0.5rem 1rem' :
                                buttonSize === 'lg' ? '0.75rem 1.5rem' :
                                buttonSize === 'xl' ? '1rem 2rem' : '0.625rem 1.25rem',
                        fontSize: buttonSize === 'xs' ? '0.75rem' :
                                 buttonSize === 'sm' ? '0.875rem' :
                                 buttonSize === 'lg' ? '1.125rem' :
                                 buttonSize === 'xl' ? '1.25rem' : '1rem',
                        borderRadius: buttonRadius === 'xs' ? '0.125rem' :
                                     buttonRadius === 'sm' ? '0.25rem' :
                                     buttonRadius === 'lg' ? '0.5rem' :
                                     buttonRadius === 'xl' ? '0.75rem' : '0.375rem',
                        backgroundColor: cancelColor === 'gray' ? '#6b7280' :
                                       cancelColor === 'blue' ? '#3b82f6' :
                                       cancelColor === 'green' ? '#22c55e' :
                                       cancelColor === 'red' ? '#ef4444' : '#6b7280',
                        color: 'white',
                        border: 'none',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.6 : 1,
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {cancelLabel}
                </button>
            )
        );

        const saveButton = (
            isMantine ? (
                <Button
                    key="save"
                    type="submit"
                    loading={isSubmitting}
                    disabled={!pageId}
                    size={buttonSize}
                    radius={buttonRadius}
                    variant={buttonVariant as any}
                    color={isRecord && existingRecordId ? updateColor : saveColor}
                >
                    {isRecord && existingRecordId ? updateLabel : saveLabel}
                </Button>
            ) : (
                <button
                    key="save"
                    type="submit"
                    disabled={isSubmitting || !pageId}
                    style={{
                        padding: buttonSize === 'xs' ? '0.25rem 0.5rem' :
                                buttonSize === 'sm' ? '0.5rem 1rem' :
                                buttonSize === 'lg' ? '0.75rem 1.5rem' :
                                buttonSize === 'xl' ? '1rem 2rem' : '0.625rem 1.25rem',
                        fontSize: buttonSize === 'xs' ? '0.75rem' :
                                 buttonSize === 'sm' ? '0.875rem' :
                                 buttonSize === 'lg' ? '1.125rem' :
                                 buttonSize === 'xl' ? '1.25rem' : '1rem',
                        borderRadius: buttonRadius === 'xs' ? '0.125rem' :
                                     buttonRadius === 'sm' ? '0.25rem' :
                                     buttonRadius === 'lg' ? '0.5rem' :
                                     buttonRadius === 'xl' ? '0.75rem' : '0.375rem',
                        backgroundColor: isRecord && existingRecordId ?
                            (updateColor === 'green' ? '#22c55e' :
                             updateColor === 'blue' ? '#3b82f6' :
                             updateColor === 'orange' ? '#f97316' :
                             updateColor === 'red' ? '#ef4444' : '#22c55e') :
                            (saveColor === 'blue' ? '#3b82f6' :
                             saveColor === 'green' ? '#22c55e' :
                             saveColor === 'red' ? '#ef4444' : '#3b82f6'),
                        color: 'white',
                        border: 'none',
                        cursor: isSubmitting || !pageId ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting || !pageId ? 0.6 : 1,
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {isSubmitting ? 'Submitting...' : (isRecord && existingRecordId ? updateLabel : saveLabel)}
                </button>
            )
        );

        // Return buttons in the specified order
        if (buttonOrder === 'save-cancel') {
            return [saveButton, cancelButton].filter(Boolean);
        } else {
            return [cancelButton, saveButton].filter(Boolean);
        }
    }, [
        buttonSize, buttonRadius, buttonVariant, buttonOrder, cancelColor, saveColor, updateColor,
        isSubmitting, pageId, isRecord, existingRecordId, handleCancel, cancelLabel, cancelUrl,
        updateLabel, saveLabel
    ]);

    // Function to get field value from existing form data
    const getFieldValue = useCallback((fieldName: string): string | null => {
        if (!isRecord || !existingFormDataFromSection) return null;
        const value = existingFormDataFromSection[fieldName];
        return value !== null && value !== undefined ? String(value) : null;
    }, [isRecord, existingFormDataFromSection]);

    // Pre-populate form fields for record types with existing data from section_data
    useEffect(() => {
        if (isRecord && existingFormDataFromSection) {
            const form = formRef.current as HTMLFormElement | null;
            if (form) {
                Object.entries(existingFormDataFromSection).forEach(([fieldName, value]) => {
                    const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                    if (field && value !== null && value !== undefined) {
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
            }
        }
    }, [isRecord, existingFormDataFromSection, existingRecordId, formKey]);

    return (
        <div style={{ position: 'relative' }}>
            <LoadingOverlay visible={isSubmitting} />
            
            {submitSuccess && alertSuccess && (
                <Alert 
                    icon={<IconCheck size={16} />} 
                    title="Success" 
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
                    title="Error" 
                    color="red" 
                    mb="md"
                    onClose={() => setSubmitError(null)}
                    withCloseButton
                >
                    {submitError}
                </Alert>
            )}

            

            <form ref={formRef} key={formKey} onSubmit={handleSubmit}>
                <input type="hidden" name="__id_sections" value={style.id} />
                {isRecord && existingRecordId ? (
                    <input type="hidden" name="record_id" value={String(existingRecordId)} />
                ) : null}
                
                <FileInputRegistrationContext.Provider value={{ registerFileInputRef }}>
                    <FormFieldValueContext.Provider value={{ getFieldValue }}>
                        <div className={getFieldContent(style, 'css') || ''}>
                            {style.children?.map((child, index) => (
                                child ? <BasicStyle key={index} style={child} /> : null
                            ))}

                            {/* Form Buttons */}
                            {useMantineStyle ? (
                                // Mantine Style Buttons
                                <Group justify={buttonPosition as any} mt="xl">
                                    {renderButtons(true)}
                                </Group>
                            ) : (
                                // Fallback HTML Buttons
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    justifyContent: buttonPosition === 'space-between' ? 'space-between' :
                                                   buttonPosition === 'center' ? 'center' :
                                                   buttonPosition === 'flex-end' ? 'flex-end' :
                                                   buttonPosition === 'flex-start' ? 'flex-start' : 'space-between',
                                    marginTop: '2rem'
                                }}>
                                    {renderButtons(false)}
                                </div>
                            )}
                        </div>
                    </FormFieldValueContext.Provider>
                </FileInputRegistrationContext.Provider>
            </form>
        </div>
    );
};

export default FormStyle;