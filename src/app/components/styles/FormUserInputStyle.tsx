import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
    IFormUserInputStyle, 
    IFormUserInputLogStyle, 
    IFormUserInputRecordStyle 
} from '../../../types/common/styles.types';
import BasicStyle from './BasicStyle';
import { Button, Alert, LoadingOverlay } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { usePageContentContext } from '../../contexts/PageContentContext';
import { useSubmitFormMutation, useUpdateFormMutation, usePageForms } from '../../../hooks/useFormSubmission';
import { getFieldContent } from '../../../utils/style-field-extractor';
import { debug } from '../../../utils/debug-logger';

interface FormUserInputStyleProps {
    style: IFormUserInputStyle | IFormUserInputLogStyle | IFormUserInputRecordStyle;
}

const FormUserInputStyle: React.FC<FormUserInputStyleProps> = ({ style }) => {
    const { pageContent } = usePageContentContext();
    const [formKey, setFormKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Extract form configuration from style
    const formName = getFieldContent(style, 'name') || 'default_form';
    const isLog = getFieldContent(style, 'is_log') === '1';
    const alertSuccess = getFieldContent(style, 'alert_success');
    const redirectUrl = getFieldContent(style, 'redirect_at_end');
    const isAjax = getFieldContent(style, 'ajax') === '1';
    const buttonLabel = getFieldContent(style, 'label') || 'Submit';
    
    // Get form ID from style - now directly available as number
    console.log('style', style);
    const sectionId = style.id;

    // Get current page ID from context
    const pageId = pageContent?.id;

    // Determine form behavior based on style name
    const isRecord = style.style_name === 'formUserInputRecord';
    const isLogType = style.style_name === 'formUserInputLog' || isLog;

    debug('FormUserInputStyle configuration', 'FormUserInputStyle', {
        styleName: style.style_name,
        sectionId,
        styleId: style.id,
        isRecord,
        isLogType,
        pageId,
        isAjax
    });

    // React Query hooks
    const submitFormMutation = useSubmitFormMutation();
    const updateFormMutation = useUpdateFormMutation();
    
    // For record types, fetch existing data to determine if we should update
    const { data: existingForms, isLoading: isLoadingExisting } = usePageForms(
        pageId || 0, 
        isRecord && !!pageId
    );

    // Memoized existing record for update operations
    const existingRecord = useMemo(() => {
        if (!isRecord || !existingForms?.data?.forms) return null;
        
        return existingForms.data.forms.find(form => 
            form.section_id === sectionId && form.page_id === pageId
        );
    }, [isRecord, existingForms, sectionId, pageId]);

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

        debug('Form submission data', 'FormUserInputStyle', {
            sectionId,
            pageId,
            formDataObject: processedFormData,
            isRecord,
            existingRecord: !!existingRecord
        });

        try {
            let response;
            
            if (isRecord && existingRecord) {
                // Update existing record
                response = await updateFormMutation.mutateAsync({
                    page_id: pageId,
                    section_id: sectionId,
                    form_data: processedFormData,
                    update_based_on: { id: existingRecord.id }
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
            if (successMessage && !isAjax) {
                // Success message is already shown by mutation hook
                debug('Form submitted successfully', 'FormUserInputStyle', {
                    message: successMessage,
                    recordId: response?.data?.record_id
                });
            }

            // Handle redirect
            if (redirectUrl && !isAjax) {
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1500); // Slightly longer delay to show success message
            }

        } catch (error: any) {
            console.error('Form submission error:', error);
            
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
        existingRecord, 
        alertSuccess, 
        redirectUrl, 
        isAjax,
        submitFormMutation,
        updateFormMutation
    ]);

    // Pre-populate form fields for record types with existing data
    useEffect(() => {
        if (isRecord && existingRecord && existingRecord.form_data) {
            const form = document.querySelector(`form[key="${formKey}"]`) as HTMLFormElement;
            if (form) {
                Object.entries(existingRecord.form_data).forEach(([fieldName, value]) => {
                    const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                    if (field && value !== null && value !== undefined) {
                        field.value = String(value);
                        
                        // Trigger change event for React components
                        const event = new Event('change', { bubbles: true });
                        field.dispatchEvent(event);
                    }
                });
            }
        }
    }, [isRecord, existingRecord, formKey]);

    return (
        <div style={{ position: 'relative' }}>
            <LoadingOverlay visible={isSubmitting || isLoadingExisting} />
            
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

            <form key={formKey} onSubmit={handleSubmit}>
                <input type="hidden" name="__id_sections" value={style.id} />
                
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
                        {isRecord && existingRecord ? `Update ${buttonLabel}` : buttonLabel}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default FormUserInputStyle;