import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Box, Card, Title, TextInput, Button, Radio, Group, Alert, Text, LoadingOverlay } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { IValidateStyle } from '../../../../types/common/styles.types';
import { usePageContentContext } from '../../contexts/PageContentContext';
import { useSubmitFormMutation, useUpdateFormMutation } from '../../../../hooks/useFormSubmission';
import { getFieldContent } from '../../../../utils/style-field-extractor';
import { useParams, useRouter } from 'next/navigation';
import { useValidateTokenMutation, useCompleteValidationMutation, useTokenValidation } from '../../../../hooks/mutations/useValidationMutations';

interface IValidateStyleProps {
    style: IValidateStyle;
}

const ValidateStyle: React.FC<IValidateStyleProps> = ({ style }) => {
    const params = useParams();
    const router = useRouter();
    const { pageContent } = usePageContentContext();
    const [formKey, setFormKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        password: '',
        passwordConfirm: ''
    });
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState<string>('');

    // Extract userId and token from URL path
    // This works with any URL pattern as long as it contains /validate/{uid}/{token}
    let userId = 0;
    let token = '';

    // Get the current pathname from params.slug (since we're using [[...slug]])
    if (params.slug && Array.isArray(params.slug)) {
        const pathParts = params.slug;
        const validateIndex = pathParts.indexOf('validate');

        if (validateIndex !== -1 && pathParts.length > validateIndex + 2) {
            // Found validate in path, extract uid and token
            userId = parseInt(pathParts[validateIndex + 1]) || 0;
            token = pathParts[validateIndex + 2] || '';
        }
    }

    // Token validation hooks
    const { data: tokenValidation, isLoading: isValidatingToken, error: tokenValidationError } = useTokenValidation(userId, token);
    const validateTokenMutation = useValidateTokenMutation();
    const completeValidationMutation = useCompleteValidationMutation();

    // Extract form configuration from style
    const title = style.title?.content;
    const subtitle = style.subtitle?.content;
    const labelName = style.label_name?.content || 'Name';
    const labelPw = style.label_pw?.content || 'Password';
    const labelPwConfirm = style.label_pw_confirm?.content || 'Confirm Password';
    const labelActivate = style.label_activate?.content || 'Activate';
    const alertFail = style.alert_fail?.content || 'Validation failed';
    const alertSuccess = style.alert_success?.content || 'Validation successful';
    const namePlaceholder = style.name_placeholder?.content;
    const nameDescription = style.name_description?.content;
    const pwPlaceholder = style.pw_placeholder?.content;
    const anonymousUserNameDescription = style.anonymous_user_name_description?.content;

    // Form configuration fields
    const formName = getFieldContent(style, 'name') || 'validate_form';
    const alertSuccessConfig = getFieldContent(style, 'alert_success') || alertSuccess;
    const redirectUrl = getFieldContent(style, 'redirect_at_end');
    const cancelUrl = getFieldContent(style, 'cancel_url');
    const saveLabel = getFieldContent(style, 'label_save') || 'Save';
    const updateLabel = getFieldContent(style, 'label_update') || 'Update';
    const cancelLabel = getFieldContent(style, 'label_cancel') || 'Cancel';

    // Button styling
    const buttonSize = getFieldContent(style, 'mantine_buttons_size') || 'sm';
    const buttonRadius = getFieldContent(style, 'mantine_buttons_radius') || 'sm';
    const buttonVariant = getFieldContent(style, 'mantine_buttons_variant') || 'filled';
    const buttonPosition = getFieldContent(style, 'mantine_buttons_position') || 'space-between';
    const buttonOrder = getFieldContent(style, 'mantine_buttons_order') || 'save-cancel';
    const activateColor = getFieldContent(style, 'mantine_btn_save_color') || 'blue';
    const cancelColor = getFieldContent(style, 'mantine_btn_cancel_color') || 'gray';

    // Card styling
    const cardShadow = getFieldContent(style, 'mantine_card_shadow') || 'sm';
    const cardPadding = getFieldContent(style, 'mantine_card_padding') || 'lg';
    const cardRadius = getFieldContent(style, 'mantine_radius') || 'sm';
    const withBorder = getFieldContent(style, 'mantine_border') === '1';

    // Container styling (global margin/padding)
    const containerPaddingX = getFieldContent(style, 'mantine_padding_inline') || 'sm';
    const containerPaddingY = getFieldContent(style, 'mantine_padding_block') || 'sm';
    const containerMarginX = getFieldContent(style, 'mantine_margin_inline') || 'none';
    const containerMarginY = getFieldContent(style, 'mantine_margin_block') || 'none';

    // Get form ID from style - now directly available as number
    const sectionId = style.id;

    // Get current page ID from context
    const pageId = pageContent?.id;
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // For validate style, these are always false (validate forms don't use record/log behavior)
    const isRecord = false;
    const isLogType = false;

    console.log(style);

    // Pre-populate form data when token validation succeeds
    useEffect(() => {
        if (tokenValidation?.data?.token_valid && tokenValidation?.data) {
            const userData = tokenValidation.data;
            setFormData(prev => ({
                ...prev,
                name: userData.name || prev.name,
                // Don't pre-populate password for security
            }));
        }
    }, [tokenValidation]);

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

        // Password matching validation
        const passwordField = formElement.querySelector('input[name="password"]') as HTMLInputElement;
        const passwordConfirmField = formElement.querySelector('input[name="passwordConfirm"]') as HTMLInputElement;

        if (passwordField && passwordConfirmField) {
            const password = passwordField.value;
            const passwordConfirm = passwordConfirmField.value;

            if (password && passwordConfirm && password !== passwordConfirm) {
                return 'Passwords do not match. Please make sure both password fields contain the same value.';
            }
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

        if (!userId || !token) {
            setSubmitError('Invalid validation link. Missing user ID or token.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);
        setPasswordError('');

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
            // Prepare validation data
            const validationData = {
                password: formData.password,
                name: formData.name || undefined,
                section_id: sectionId,
                form_inputs: processedFormData
            };

            // Use complete validation endpoint
            const response = await completeValidationMutation.mutateAsync({
                userId,
                token,
                data: validationData
            });

            setSubmitSuccess(true);

            // Handle success alert - prefer backend message over style message
            const successMessage = (response as any)?.data?.message || alertSuccessConfig;

            // Handle redirect
            if (redirectUrl) {
                setTimeout(() => {
                    router.push(redirectUrl);
                }, 1500); // Slightly longer delay to show success message
            }

        } catch (error: any) {
            // Extract error message from API response if available
            let errorMessage = 'Failed to complete validation. Please try again.';
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
        userId,
        token,
        sectionId,
        formData,
        alertSuccessConfig,
        redirectUrl,
        completeValidationMutation
    ]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear general errors
        if (errors.length > 0) {
            setErrors([]);
        }

        // Real-time password matching validation
        if (field === 'password' || field === 'passwordConfirm') {
            const newFormData = { ...formData, [field]: value };
            if (newFormData.password && newFormData.passwordConfirm) {
                if (newFormData.password !== newFormData.passwordConfirm) {
                    setPasswordError('Passwords do not match');
                } else {
                    setPasswordError('');
                }
            } else {
                setPasswordError('');
            }
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

    // Show loading while validating token
    if (isValidatingToken) {
        return (
            <Box className={cssClass}
                p={containerPaddingX}
                pt={containerPaddingY}
                m={containerMarginX}
                mt={containerMarginY}>
                <Card
                    shadow={cardShadow}
                    padding={cardPadding}
                    radius={cardRadius}
                    withBorder={withBorder}
                >
                    <LoadingOverlay visible={true} />
                    <Title order={2} mb="md">
                        Validating Link
                    </Title>
                    <Text size="md" c="dimmed">
                        Please wait while we validate your account activation link...
                    </Text>
                </Card>
            </Box>
        );
    }

    // Show error if token validation failed or token is invalid
    if (tokenValidationError || tokenValidation?.data?.token_valid === false) {
        return (
            <Box className={cssClass}
                p={containerPaddingX}
                pt={containerPaddingY}
                m={containerMarginX}
                mt={containerMarginY}>
                <Card
                    shadow={cardShadow}
                    padding={cardPadding}
                    radius={cardRadius}
                    withBorder={withBorder}
                >
                    <Alert icon={<IconX size={16} />} color="red" title="Invalid Validation Link">
                        <Text size="md" fw={500} mb="sm">
                            Account validation failed
                        </Text>
                        <Text size="sm">
                            {tokenValidation?.data?.message ||
                             tokenValidationError?.message ||
                             'This validation link is invalid or has expired. Please request a new validation email.'}
                        </Text>
                    </Alert>
                </Card>
            </Box>
        );
    }

    // Don't show validation form until token is confirmed valid
    if (!tokenValidation?.data?.token_valid) {
        return null;
    }

    // Show validation form if token is valid
    return (
        <>
            <LoadingOverlay visible={isSubmitting} />

            <Box className={cssClass}
                p={containerPaddingX}
                pt={containerPaddingY}
                m={containerMarginX}
                mt={containerMarginY}>
                <Card
                    shadow={cardShadow}
                    padding={cardPadding}
                    radius={cardRadius}
                    withBorder={withBorder}
                >
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
                                error={passwordError}
                                required
                                mb="md"
                            />


                            <Group justify={cancelUrl || cancelLabel ? buttonPosition as any : "center"} mt="xl">
                                {buttonOrder === 'cancel-save' && (cancelUrl || cancelLabel) && (
                                    <Button
                                        type="button"
                                        onClick={handleCancel}
                                        size={buttonSize}
                                        radius={buttonRadius}
                                        color={cancelColor}
                                        variant="light"
                                        disabled={isSubmitting}
                                        mr={buttonPosition === 'space-between' ? 'auto' : undefined}
                                    >
                                        {cancelLabel}
                                    </Button>
                                )}

                                <Button
                                    type="submit"
                                    loading={isSubmitting}
                                    disabled={!pageId}
                                    size={buttonSize}
                                    radius={buttonRadius}
                                    color={activateColor}
                                    variant={buttonVariant}
                                    ml={buttonOrder === 'cancel-save' && buttonPosition === 'space-between' ? 'auto' : undefined}
                                >
                                    {isRecord && existingRecordId ? updateLabel : (labelActivate || saveLabel)}
                                </Button>

                                {buttonOrder === 'save-cancel' && (cancelUrl || cancelLabel) && (
                                    <Button
                                        type="button"
                                        onClick={handleCancel}
                                        size={buttonSize}
                                        radius={buttonRadius}
                                        color={cancelColor}
                                        variant="light"
                                        disabled={isSubmitting}
                                        ml={buttonPosition === 'space-between' ? 'auto' : undefined}
                                    >
                                        {cancelLabel}
                                    </Button>
                                )}
                            </Group>
                        </form>
                    )}
                </Card>
            </Box>
        </>
    );
};

export default ValidateStyle; 