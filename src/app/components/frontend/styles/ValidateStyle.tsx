import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Box, Card, Title, TextInput, Button, Radio, Group, Alert, Text, LoadingOverlay } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { IValidateStyle } from '../../../../types/common/styles.types';
import { usePageContentContext } from '../../contexts/PageContentContext';
import { useSubmitFormMutation, useUpdateFormMutation } from '../../../../hooks/useFormSubmission';
import { getFieldContent } from '../../../../utils/style-field-extractor';

interface IValidateStyleProps {
    style: IValidateStyle;
}

const ValidateStyle: React.FC<IValidateStyleProps> = ({ style }) => {
    const { pageContent } = usePageContentContext();
    const [formKey, setFormKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        password: '',
        passwordConfirm: '',
        gender: ''
    });
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);

    // Extract form configuration from style
    const title = style.title?.content;
    const subtitle = style.subtitle?.content;
    const labelName = style.label_name?.content || 'Name';
    const labelPw = style.label_pw?.content || 'Password';
    const labelPwConfirm = style.label_pw_confirm?.content || 'Confirm Password';
    const labelGender = style.label_gender?.content || 'Gender';
    const genderMale = style.gender_male?.content || 'Male';
    const genderFemale = style.gender_female?.content || 'Female';
    const genderDivers = style.gender_divers?.content || 'Other';
    const labelActivate = style.label_activate?.content || 'Activate';
    const alertFail = style.alert_fail?.content || 'Validation failed';
    const alertSuccess = style.alert_success?.content || 'Validation successful';
    const namePlaceholder = style.name_placeholder?.content;
    const nameDescription = style.name_description?.content;
    const pwPlaceholder = style.pw_placeholder?.content;
    const anonymousUserNameDescription = style.anonymous_user_name_description?.content;

    // Form configuration fields
    const formName = getFieldContent(style, 'name') || 'validate_form';
    const isLog = getFieldContent(style, 'is_log') === '1';
    const alertSuccessConfig = getFieldContent(style, 'alert_success') || alertSuccess;
    const redirectUrl = getFieldContent(style, 'redirect_at_end');
    const cancelUrl = getFieldContent(style, 'cancel_url');
    const isAjax = getFieldContent(style, 'ajax') === '1';
    const saveLabel = getFieldContent(style, 'label_save') || 'Save';
    const updateLabel = getFieldContent(style, 'label_update') || 'Update';
    const cancelLabel = getFieldContent(style, 'label_cancel') || 'Cancel';

    // Get form ID from style - now directly available as number
    const sectionId = style.id;

    // Get current page ID from context
    const pageId = pageContent?.id;

    // Determine form behavior based on style name
    const isRecord = style.style_name === 'form-record' || style.style_name === 'form-record';
    const isLogType = style.style_name === 'form-log' || style.style_name === 'form-log' || isLog;

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

        const formDataObj = new FormData(formElement);

        // Create clean FormData with only user-defined fields
        const cleanFormData = new FormData();

        // Add only non-internal fields from the original form
        for (const [key, value] of formDataObj.entries()) {
            // Skip internal fields and section-* fields
            if (key === '__id_sections' ||
                key === 'section_id' ||
                key === 'page_id' ||
                key === 'record_id' ||
                key.startsWith('section-')) {
                continue;
            }

            // Add user-defined fields
            cleanFormData.append(key, value);
        }

        const formDataObject = Object.fromEntries(cleanFormData.entries());

        // Convert empty strings to null for better data handling
        const processedFormData: Record<string, any> = {};
        Object.keys(formDataObject).forEach(key => {
            const value = formDataObject[key];
            processedFormData[key] = value === '' ? null : value;
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
            const successMessage = response?.data?.message || alertSuccessConfig;

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
        alertSuccessConfig,
        redirectUrl,
        isAjax,
        submitFormMutation,
        updateFormMutation
    ]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors.length > 0) {
            setErrors([]);
        }
    };

    const handleCancel = useCallback(() => {
        if (cancelUrl) {
            window.location.href = cancelUrl;
        } else {
            // Default cancel behavior - could go back or stay on page
            window.history.back();
        }
    }, [cancelUrl]);

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

            <Box className={style.css ?? ""}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    {title && (
                        <Title order={2} mb="md">
                            {title}
                        </Title>
                    )}

                    {subtitle && (
                        <Text size="md" c="dimmed" mb="lg">
                            {subtitle}
                        </Text>
                    )}

                    {submitSuccess ? (
                        <Alert icon={<IconCheck size={16} />} color="green" title="Success">
                            {alertSuccessConfig}
                        </Alert>
                    ) : (
                        <form ref={formRef} key={formKey} onSubmit={handleSubmit}>
                            <input type="hidden" name="__id_sections" value={style.id} />
                            {isRecord && existingRecordId ? (
                                <input type="hidden" name="record_id" value={String(existingRecordId)} />
                            ) : null}

                            {submitError && (
                                <Alert icon={<IconX size={16} />} color="red" title={alertFail} mb="md" onClose={() => setSubmitError(null)} withCloseButton>
                                    {submitError}
                                </Alert>
                            )}

                            {errors.length > 0 && (
                                <Alert icon={<IconX size={16} />} color="red" title={alertFail} mb="md">
                                    <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                                        {errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </Alert>
                            )}

                        <TextInput
                            label={labelName}
                            placeholder={namePlaceholder}
                            description={nameDescription || anonymousUserNameDescription}
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                            mb="md"
                        />

                        <TextInput
                            label={labelPw}
                            placeholder={pwPlaceholder}
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            required
                            mb="md"
                        />

                        <TextInput
                            label={labelPwConfirm}
                            type="password"
                            value={formData.passwordConfirm}
                            onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
                            required
                            mb="md"
                        />

                        <Box mb="md">
                            <Text size="sm" fw={500} mb="xs">
                                {labelGender} <Text component="span" c="red">*</Text>
                            </Text>
                            <Radio.Group
                                value={formData.gender}
                                onChange={(value) => handleInputChange('gender', value)}
                                required
                            >
                                <Group mt="xs">
                                    <Radio value="male" label={genderMale} />
                                    <Radio value="female" label={genderFemale} />
                                    <Radio value="other" label={genderDivers} />
                                </Group>
                            </Radio.Group>
                        </Box>

                            <Group justify={cancelUrl || cancelLabel ? "space-between" : "center"} mt="xl">
                                <Button
                                    type="submit"
                                    loading={isSubmitting}
                                    disabled={!pageId}
                                    size="md"
                                    radius="md"
                                    color="blue"
                                    variant="filled"
                                >
                                    {isRecord && existingRecordId ? updateLabel : saveLabel}
                                </Button>

                                {(cancelUrl || cancelLabel) && (
                                    <Button
                                        type="button"
                                        onClick={handleCancel}
                                        size="md"
                                        radius="md"
                                        color="gray"
                                        variant="light"
                                        disabled={isSubmitting}
                                    >
                                        {cancelLabel}
                                    </Button>
                                )}
                            </Group>
                        </form>
                    )}
                </Card>
            </Box>
        </div>
    );
};

export default ValidateStyle; 