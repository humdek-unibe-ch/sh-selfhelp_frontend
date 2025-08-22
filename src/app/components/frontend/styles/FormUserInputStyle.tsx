import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
    IFormUserInputStyle, 
    IFormUserInputLogStyle, 
    IFormUserInputRecordStyle 
} from '../../../../types/common/styles.types';
import BasicStyle from './BasicStyle';
import { Button, Alert, LoadingOverlay } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { usePageContentContext } from '../../contexts/PageContentContext';
import { useSubmitFormMutation, useUpdateFormMutation } from '../../../../hooks/useFormSubmission';
import { getFieldContent } from '../../../../utils/style-field-extractor';

interface FormUserInputStyleProps {
    style: IFormUserInputStyle | IFormUserInputLogStyle | IFormUserInputRecordStyle;
}

const FormUserInputStyle: React.FC<FormUserInputStyleProps> = ({ style }) => {
    const { pageContent } = usePageContentContext();
    const [formKey, setFormKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);

    // Extract form configuration from style
    const formName = getFieldContent(style, 'name') || 'default_form';
    const isLog = getFieldContent(style, 'is_log') === '1';
    const alertSuccess = getFieldContent(style, 'alert_success');
    const redirectUrl = getFieldContent(style, 'redirect_at_end');
    const isAjax = getFieldContent(style, 'ajax') === '1';
    const buttonLabel = getFieldContent(style, 'label') || 'Submit';
    
    // Get form ID from style - now directly available as number

    const sectionId = style.id;

    // Get current page ID from context
    const pageId = pageContent?.id;

    // Determine form behavior based on style name
    const isRecord = style.style_name === 'formUserInputRecord';
    const isLogType = style.style_name === 'formUserInputLog' || isLog;

    // React Query hooks
    const submitFormMutation = useSubmitFormMutation();
    const updateFormMutation = useUpdateFormMutation();
    
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
        const formDataObject = Object.fromEntries(formData.entries());

        // Remove internal fields
        delete formDataObject.__id_sections;

        // Convert empty strings to null for better data handling
        const processedFormData: Record<string, any> = {};
        Object.keys(formDataObject).forEach(key => {
            processedFormData[key] = formDataObject[key] === '' ? null : formDataObject[key];
        });

        try {
            let response;
            
            if (isRecord && existingRecordId) {
                // Update existing record
                response = await updateFormMutation.mutateAsync({
                    page_id: pageId,
                    section_id: sectionId,
                    form_data: processedFormData,
                    update_based_on: { record_id: existingRecordId }
                });
            } else {
                // Create new record (for both log and new record types)
                response = await submitFormMutation.mutateAsync({
                    page_id: pageId,
                    section_id: sectionId,
                    form_data: processedFormData
                });
            }

            setSubmitSuccess(true);
            
            // Reset form for log types, keep data for record types
            if (isLogType) {
                setFormKey(prev => prev + 1);
            }

            // Handle success alert - prefer backend message over style message
            const successMessage = response?.data?.message || alertSuccess;

            // Handle redirect
            if (redirectUrl && !isAjax) {
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1500); // Slightly longer delay to show success message
            }

        } catch (error: any) {

            
            // Extract error message from API response if available
            let errorMessage = 'Failed to submit form. Please try again.';
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
        redirectUrl, 
        isAjax,
        submitFormMutation,
        updateFormMutation
    ]);

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
                
                <div className={getFieldContent(style, 'css') || ''}>
                    {style.children?.map((child, index) => (
                        child ? <BasicStyle key={index} style={child} /> : null
                    ))}
                    
                    <Button 
                        type="submit" 
                        loading={isSubmitting}
                        disabled={!pageId}
                        mt="md"
                    >
                        {isRecord && existingRecordId ? `Update ${buttonLabel}` : buttonLabel}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default FormUserInputStyle;