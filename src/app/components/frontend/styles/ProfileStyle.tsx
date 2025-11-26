'use client';

import React, { useState, Fragment, useEffect } from 'react';
import {
    Paper,
    Title,
    Text,
    Stack,
    Group,
    TextInput,
    PasswordInput,
    Select,
    Button,
    Alert,
    Card,
    Modal,
    Accordion
} from '@mantine/core';
import { IconUser, IconKey, IconTrash, IconAlertTriangle, IconCheck, IconX, IconClock } from '@tabler/icons-react';
import { useAuthUser } from '../../../../hooks/useUserData';
import { useUpdateUsernameMutation, useUpdateNameMutation, useUpdatePasswordMutation, useUpdateTimezoneMutation, useDeleteAccountMutation } from '../../../../hooks/mutations/useProfileMutations';
import { useLookupsByType } from '../../../../hooks/useLookups';
import { IProfileStyle } from '../../../../types/common/styles.types';
import { sanitizeHtmlForInline } from '../../../../utils/html-sanitizer.utils';

/**
 * Helper component to render HTML content safely
 */
const HtmlContent: React.FC<{ html: string; className?: string }> = ({ html, className }) => {
    if (!html) return null;
    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: sanitizeHtmlForInline(html) }}
        />
    );
};

/**
 * Props interface for ProfileStyle component
 */
/**
 * Props interface for IProfileStyle component
 */
interface IProfileStyleProps {
    style: IProfileStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * ProfileStyle component renders a comprehensive user profile management interface
 * with sections for user information display, username change, password reset, and account deletion
 */
const ProfileStyle: React.FC<IProfileStyleProps> = ({ style, styleProps, cssClass }) => {
    const { user, isLoading: userLoading } = useAuthUser();

    // Timezone lookups
    const timezoneLookups = useLookupsByType('timezones');

    // Mutations
    const updateUsernameMutation = useUpdateUsernameMutation();
    const updateNameMutation = useUpdateNameMutation();
    const updatePasswordMutation = useUpdatePasswordMutation();
    const updateTimezoneMutation = useUpdateTimezoneMutation();
    const deleteAccountMutation = useDeleteAccountMutation();

    // Form states
    const [nameForm, setNameForm] = useState({
        newName: '',
        isSubmitting: false,
        error: '',
        success: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        isSubmitting: false,
        error: '',
        success: ''
    });

    const [timezoneForm, setTimezoneForm] = useState({
        timezoneId: '',
        isSubmitting: false,
        error: '',
        success: ''
    });

    const [deleteForm, setDeleteForm] = useState({
        email: '',
        isSubmitting: false,
        error: '',
        success: ''
    });

    // Modal states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Initialize timezone form with user's current timezone
    useEffect(() => {
        if (user?.timezoneId && timezoneForm.timezoneId === '') {
            setTimezoneForm(prev => ({
                ...prev,
                timezoneId: user.timezoneId!.toString()
            }));
        }
    }, [user?.timezoneId, timezoneForm.timezoneId]);

    // Extract field values
    const profileTitle = style.profile_title?.content || 'My Profile';

    // User info labels
    const accountInfoTitle = style.profile_account_info_title?.content || 'Account Information';
    const labelEmail = style.profile_label_email?.content || 'Email';
    const labelUsername = style.profile_label_username?.content || 'Username';
    const labelName = style.profile_label_name?.content || 'Full Name';
    const labelCreated = style.profile_label_created?.content || 'Account Created';
    const labelLastLogin = style.profile_label_last_login?.content || 'Last Login';
    const labelTimezone = style.profile_label_timezone?.content || 'Timezone';

    // Name change fields
    const nameChangeTitle = style.profile_name_change_title?.content || 'Change Display Name';
    const nameChangeDescription = style.profile_name_change_description?.content || '<p>Update your display name. This will be visible to other users.</p>';
    const nameChangeLabel = style.profile_name_change_label?.content || 'New Display Name';
    const nameChangePlaceholder = style.profile_name_change_placeholder?.content || 'Enter new display name';
    const nameChangeButton = style.profile_name_change_button?.content || 'Update Display Name';

    // Name change messages
    const nameSuccess = style.profile_name_change_success?.content || 'Display name updated successfully!';
    const nameErrorRequired = style.profile_name_change_error_required?.content || 'Display name is required';
    const nameErrorInvalid = style.profile_name_change_error_invalid?.content || 'Display name contains invalid characters';
    const nameErrorGeneral = style.profile_name_change_error_general?.content || 'Failed to update display name. Please try again.';

    // Password reset fields
    const passwordResetTitle = style.profile_password_reset_title?.content || 'Change Password';
    const passwordResetDescription = style.profile_password_reset_description?.content || '<p>Set a new password for your account. Make sure it is strong and secure.</p>';
    const passwordResetLabelCurrent = style.profile_password_reset_label_current?.content || 'Current Password';
    const passwordResetLabelNew = style.profile_password_reset_label_new?.content || 'New Password';
    const passwordResetLabelConfirm = style.profile_password_reset_label_confirm?.content || 'Confirm New Password';
    const passwordResetPlaceholderCurrent = style.profile_password_reset_placeholder_current?.content || 'Enter current password';
    const passwordResetPlaceholderNew = style.profile_password_reset_placeholder_new?.content || 'Enter new password';
    const passwordResetPlaceholderConfirm = style.profile_password_reset_placeholder_confirm?.content || 'Confirm new password';
    const passwordResetButton = style.profile_password_reset_button?.content || 'Update Password';

    // Password reset messages
    const passwordSuccess = style.profile_password_reset_success?.content || 'Password updated successfully!';
    const passwordErrorCurrentRequired = style.profile_password_reset_error_current_required?.content || 'Current password is required';
    const passwordErrorCurrentWrong = style.profile_password_reset_error_current_wrong?.content || 'Current password is incorrect';
    const passwordErrorNewRequired = style.profile_password_reset_error_new_required?.content || 'New password is required';
    const passwordErrorConfirmRequired = style.profile_password_reset_error_confirm_required?.content || 'Password confirmation is required';
    const passwordErrorMismatch = style.profile_password_reset_error_mismatch?.content || 'New passwords do not match';
    const passwordErrorWeak = style.profile_password_reset_error_weak?.content || 'Password is too weak. Please choose a stronger password.';
    const passwordErrorGeneral = style.profile_password_reset_error_general?.content || 'Failed to update password. Please try again.';

    // Timezone change fields
    const timezoneChangeTitle = style.profile_timezone_change_title?.content || 'Change Timezone';
    const timezoneChangeDescription = style.profile_timezone_change_description?.content || '<p>Select your preferred timezone. This will affect how dates and times are displayed.</p>';
    const timezoneChangeLabel = style.profile_timezone_change_label?.content || 'Timezone';
    const timezoneChangePlaceholder = style.profile_timezone_change_placeholder?.content || 'Select a timezone';
    const timezoneChangeButton = style.profile_timezone_change_button?.content || 'Update Timezone';

    // Timezone change messages
    const timezoneSuccess = style.profile_timezone_change_success?.content || 'Timezone updated successfully!';
    const timezoneErrorRequired = style.profile_timezone_change_error_required?.content || 'Timezone is required';
    const timezoneErrorGeneral = style.profile_timezone_change_error_general?.content || 'Failed to update timezone. Please try again.';

    // Account deletion fields
    const deleteTitle = style.profile_delete_title?.content || 'Delete Account';
    const deleteDescription = style.profile_delete_description?.content || '<p>Permanently delete your account and all associated data. This action cannot be undone.</p>';
    const deleteAlertText = style.profile_delete_alert_text?.content || 'This action cannot be undone. All your data will be permanently deleted.';
    const deleteModalWarning = style.profile_delete_modal_warning?.content || '<p>Deleting your account will permanently remove all your data, including profile information, preferences, and any content you have created.</p>';
    const deleteLabelEmail = style.profile_delete_label_email?.content || 'Confirm Email';
    const deletePlaceholderEmail = style.profile_delete_placeholder_email?.content || 'Enter your email to confirm';
    const deleteButton = style.profile_delete_button?.content || 'Delete Account';

    // Account deletion messages
    const deleteSuccess = style.profile_delete_success?.content || 'Account deleted successfully.';
    const deleteErrorEmailRequired = style.profile_delete_error_email_required?.content || 'Email confirmation is required';
    const deleteErrorEmailMismatch = style.profile_delete_error_email_mismatch?.content || 'Email does not match your account email';
    const deleteErrorGeneral = style.profile_delete_error_general?.content || 'Failed to delete account. Please try again.';

    // UI Configuration
    const gap = style.profile_gap?.content || 'md';
    const useAccordion = style.profile_use_accordion?.content === '1' || style.profile_use_accordion?.content === 'true';
    const accordionMultiple = style.profile_accordion_multiple?.content === '1' || style.profile_accordion_multiple?.content === 'true';
    const defaultOpenedSections = style.profile_accordion_default_opened?.content ?
        style.profile_accordion_default_opened.content.split(',').map(s => s.trim()) :
        ['user_info'];

    // Styling options
    const cardVariant = (style.profile_variant?.content as any) || 'default';
    const cardRadius = (style.profile_radius?.content as any) || 'sm';
    const cardShadow = (style.profile_shadow?.content as any) || 'sm';

    // Layout configuration
    const columns = parseInt(style.profile_columns?.content || '1');

    

    // Convert spacing values to CSS
    const getSpacingValue = (value: string) => {
        if (value === 'none') return undefined;
        return value; // Mantine handles xs, sm, md, lg, xl
    };

    // Extract backend error message from API response
    const getBackendErrorMessage = (error: any) => {
        return error?.response?.data?.error ||
               error?.response?.data?.message ||
               error?.message;
    };

    // Format date helper
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Never';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'Unknown';
        }
    };

    // Name change handlers
    const handleNameChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setNameForm(prev => ({ ...prev, error: '', success: '' }));

        if (!nameForm.newName.trim()) {
            setNameForm(prev => ({ ...prev, error: nameErrorRequired }));
            return;
        }

        updateNameMutation.mutate(
            { newName: nameForm.newName },
            {
                onSuccess: () => {
                    setNameForm(prev => ({
                        ...prev,
                        success: nameSuccess,
                        newName: '',
                        isSubmitting: false
                    }));
                },
                onError: (error: any) => {
                    let errorMessage = nameErrorGeneral;

                    // Include backend error message if available
                    const backendError = getBackendErrorMessage(error);
                    if (backendError && backendError !== errorMessage) {
                        errorMessage = `${errorMessage} ${backendError}`;
                    }

                    setNameForm(prev => ({ ...prev, error: errorMessage, isSubmitting: false }));
                }
            }
        );
    };

    // Password change handlers
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordForm(prev => ({ ...prev, error: '', success: '' }));

        if (!passwordForm.currentPassword) {
            setPasswordForm(prev => ({ ...prev, error: passwordErrorCurrentRequired }));
            return;
        }
        if (!passwordForm.newPassword) {
            setPasswordForm(prev => ({ ...prev, error: passwordErrorNewRequired }));
            return;
        }
        if (!passwordForm.confirmPassword) {
            setPasswordForm(prev => ({ ...prev, error: passwordErrorConfirmRequired }));
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordForm(prev => ({ ...prev, error: passwordErrorMismatch }));
            return;
        }

        updatePasswordMutation.mutate(
            {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            },
            {
                onSuccess: () => {
                    setPasswordForm(prev => ({
                        ...prev,
                        success: passwordSuccess,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                        isSubmitting: false
                    }));
                },
                onError: (error: any) => {
                    let errorMessage = passwordErrorGeneral;
                    if (error?.response?.status === 401) {
                        errorMessage = passwordErrorCurrentWrong;
                    } else if (error?.response?.status === 400) {
                        errorMessage = passwordErrorWeak;
                    }

                    // Include backend error message if available
                    const backendError = getBackendErrorMessage(error);
                    if (backendError && backendError !== errorMessage) {
                        errorMessage = `${errorMessage} ${backendError}`;
                    }

                    setPasswordForm(prev => ({ ...prev, error: errorMessage, isSubmitting: false }));
                }
            }
        );
    };

    // Timezone change handlers
    const handleTimezoneChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setTimezoneForm(prev => ({ ...prev, error: '', success: '' }));

        if (!timezoneForm.timezoneId) {
            setTimezoneForm(prev => ({ ...prev, error: timezoneErrorRequired }));
            return;
        }

        updateTimezoneMutation.mutate(
            { timezoneId: parseInt(timezoneForm.timezoneId) },
            {
                onSuccess: () => {
                    setTimezoneForm(prev => ({
                        ...prev,
                        success: timezoneSuccess,
                        timezoneId: '',
                        isSubmitting: false
                    }));
                },
                onError: (error: any) => {
                    let errorMessage = timezoneErrorGeneral;

                    // Include backend error message if available
                    const backendError = getBackendErrorMessage(error);
                    if (backendError && backendError !== errorMessage) {
                        errorMessage = `${errorMessage} ${backendError}`;
                    }

                    setTimezoneForm(prev => ({ ...prev, error: errorMessage, isSubmitting: false }));
                }
            }
        );
    };

    // Account deletion handlers
    const handleDeleteAccount = async () => {
        setDeleteForm(prev => ({ ...prev, error: '', success: '' }));

        if (!deleteForm.email.trim()) {
            setDeleteForm(prev => ({ ...prev, error: deleteErrorEmailRequired }));
            return;
        }

        if (deleteForm.email !== user?.email) {
            setDeleteForm(prev => ({ ...prev, error: deleteErrorEmailMismatch }));
            return;
        }

        deleteAccountMutation.mutate(
            { emailConfirmation: deleteForm.email },
            {
                onSuccess: () => {
                    setDeleteForm(prev => ({
                        ...prev,
                        success: deleteSuccess,
                        email: '',
                        isSubmitting: false
                    }));
                    setDeleteModalOpen(false);
                },
                onError: (error: any) => {
                    let errorMessage = deleteErrorGeneral;

                    // Include backend error message if available
                    const backendError = getBackendErrorMessage(error);
                    if (backendError && backendError !== errorMessage) {
                        errorMessage = `${errorMessage} ${backendError}`;
                    }

                    setDeleteForm(prev => ({ ...prev, error: errorMessage, isSubmitting: false }));
                }
            }
        );
    };

    if (userLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return (
            <Alert color="red" title="Authentication Required">
                You must be logged in to view your profile.
            </Alert>
        );
    }

    // Helper function to create card content
    const renderUserInfoCard = () => (
        <Card
            withBorder
            radius={cardRadius}
            p="lg"
            variant={cardVariant}
            shadow={cardShadow}
        >
            {!useAccordion && (
            <Title order={3} mb="md">{accountInfoTitle}</Title>
            )}
            <Stack gap="sm">
                <Group>
                    <Text fw={500} w={120}>{labelEmail}:</Text>
                    <Text>{user.email}</Text>
                </Group>
                <Group>
                    <Text fw={500} w={120}>{labelUsername}:</Text>
                    <Text>{user.user_name || 'Not set'}</Text>
                </Group>
                <Group>
                    <Text fw={500} w={120}>{labelName}:</Text>
                    <Text>{user.name}</Text>
                </Group>
                <Group>
                    <Text fw={500} w={120}>{labelCreated}:</Text>
                    <Text>{formatDate('')}</Text> {/* TODO: Add created_at to user data */}
                </Group>
                <Group>
                    <Text fw={500} w={120}>{labelLastLogin}:</Text>
                    <Text>{formatDate('')}</Text> {/* TODO: Add last_login to user data */}
                </Group>
                <Group>
                    <Text fw={500} w={120}>{labelTimezone}:</Text>
                    <Text>{user.timezoneLookupValue || 'Not set'}</Text>
                </Group>
            </Stack>
        </Card>
    );

    const renderNameChangeCard = () => (
        <Card
            withBorder
            radius={cardRadius}
            p="lg"
            variant={cardVariant}
            shadow={cardShadow}
        >
            {!useAccordion && (
            <Title order={3} mb="sm">{nameChangeTitle}</Title>
            )}
            <HtmlContent html={nameChangeDescription} className="mb-md text-dimmed" />

            <form onSubmit={handleNameChange}>
                <Stack gap="md">
                    <TextInput
                        label={nameChangeLabel}
                        placeholder={nameChangePlaceholder}
                        value={nameForm.newName}
                        onChange={(e) => setNameForm(prev => ({ ...prev, newName: e.target.value }))}
                        error={nameForm.error}
                        disabled={nameForm.isSubmitting}
                    />

                    {nameForm.success && (
                        <Alert color="green" icon={<IconCheck size={16} />}>
                            {nameForm.success}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        loading={nameForm.isSubmitting}
                        leftSection={<IconUser size={16} />}
                    >
                        {nameChangeButton}
                    </Button>
                </Stack>
            </form>
        </Card>
    );

    const renderPasswordChangeCard = () => (
        <Card
            withBorder
            radius={cardRadius}
            p="lg"
            variant={cardVariant}
            shadow={cardShadow}
        >
            {!useAccordion && (
            <Title order={3} mb="sm">{passwordResetTitle}</Title>
            )}
            <HtmlContent html={passwordResetDescription} className="mb-md text-dimmed" />

            <form onSubmit={handlePasswordChange}>
                <Stack gap="md">
                    <PasswordInput
                        label={passwordResetLabelCurrent}
                        placeholder={passwordResetPlaceholderCurrent}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        disabled={passwordForm.isSubmitting}
                    />

                    <PasswordInput
                        label={passwordResetLabelNew}
                        placeholder={passwordResetPlaceholderNew}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        disabled={passwordForm.isSubmitting}
                    />

                    <PasswordInput
                        label={passwordResetLabelConfirm}
                        placeholder={passwordResetPlaceholderConfirm}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        disabled={passwordForm.isSubmitting}
                    />

                    {passwordForm.error && (
                        <Alert color="red" icon={<IconX size={16} />}>
                            {passwordForm.error}
                        </Alert>
                    )}

                    {passwordForm.success && (
                        <Alert color="green" icon={<IconCheck size={16} />}>
                            {passwordForm.success}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        loading={passwordForm.isSubmitting}
                        leftSection={<IconKey size={16} />}
                    >
                        {passwordResetButton}
                    </Button>
                </Stack>
            </form>
        </Card>
    );

    const renderTimezoneChangeCard = () => (
        <Card
            withBorder
            radius={cardRadius}
            p="lg"
            variant={cardVariant}
            shadow={cardShadow}
        >
            {!useAccordion && (
            <Title order={3} mb="sm">{timezoneChangeTitle}</Title>
            )}
            <HtmlContent html={timezoneChangeDescription} className="mb-md text-dimmed" />

            <form onSubmit={handleTimezoneChange}>
                <Stack gap="md">
                    <Select
                        label={timezoneChangeLabel}
                        placeholder={timezoneChangePlaceholder}
                        data={timezoneLookups.map(tz => ({
                            value: tz.id.toString(),
                            label: `${tz.lookupCode} - ${tz.lookupDescription}`
                        }))}
                        value={timezoneForm.timezoneId}
                        onChange={(value) => setTimezoneForm(prev => ({ ...prev, timezoneId: value || '' }))}
                        searchable
                        required
                        error={timezoneForm.error}
                        disabled={timezoneForm.isSubmitting}
                    />

                    {timezoneForm.success && (
                        <Alert color="green" icon={<IconCheck size={16} />}>
                            {timezoneForm.success}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        loading={timezoneForm.isSubmitting}
                        leftSection={<IconClock size={16} />}
                    >
                        {timezoneChangeButton}
                    </Button>
                </Stack>
            </form>
        </Card>
    );

    const renderAccountDeletionCard = () => (
        <Card
            withBorder
            radius={cardRadius}
            p="lg"
            variant={cardVariant}
            shadow={cardShadow}
        >
            {!useAccordion && (
            <Title order={3} mb="sm" c="red">{deleteTitle}</Title>
            )}
            <HtmlContent html={deleteDescription} className="mb-md text-dimmed" />

            <Alert color="red" variant="light" icon={<IconAlertTriangle size={16} />}>
                {deleteAlertText}
            </Alert>

            <Group mt="md">
                <Button
                    color="red"
                    variant="light"
                    leftSection={<IconTrash size={16} />}
                    onClick={() => setDeleteModalOpen(true)}
                >
                    {deleteButton}
                </Button>
            </Group>
        </Card>
    );

    // Create grid layout for non-accordion mode
    const renderGridLayout = () => {
        const cards = [
            <Fragment key="user-info">{renderUserInfoCard()}</Fragment>,
            <Fragment key="name-change">{renderNameChangeCard()}</Fragment>,
            <Fragment key="timezone-change">{renderTimezoneChangeCard()}</Fragment>,
            <Fragment key="password-change">{renderPasswordChangeCard()}</Fragment>,
            <Fragment key="account-delete">{renderAccountDeletionCard()}</Fragment>
        ];

        if (columns === 1) {
            return <Stack gap={gap}>{cards}</Stack>;
        }

        // For multi-column layout, group cards
        const rows = [];
        for (let i = 0; i < cards.length; i += columns) {
            const rowCards = cards.slice(i, i + columns);
            rows.push(
                <Group key={`row-${i}`} gap={gap} grow align="stretch">
                    {rowCards}
                </Group>
            );
        }

        return <Stack gap={gap}>{rows}</Stack>;
    };

    return (
        <Stack
            gap={gap}
            {...styleProps} className={cssClass}
        >
            {/* Profile Header */}
            {profileTitle && (
            <Paper p="lg" radius="md" withBorder>
                <Group>
                    <IconUser size={32} />
                        <Title order={2}>{profileTitle}</Title>
                    </Group>
                </Paper>
            )}

            {useAccordion ? (
                <Accordion
                    multiple={accordionMultiple}
                    defaultValue={defaultOpenedSections}
                    variant={cardVariant}
                    radius={cardRadius}
                >
                    <Accordion.Item value="user_info">
                        <Accordion.Control icon={<IconUser size={16} />}>
                            {accountInfoTitle}
                        </Accordion.Control>
                        <Accordion.Panel>
                            {renderUserInfoCard()}
                        </Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item value="name_change">
                        <Accordion.Control icon={<IconUser size={16} />}>
                            {nameChangeTitle}
                        </Accordion.Control>
                        <Accordion.Panel>
                            {renderNameChangeCard()}
                        </Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item value="timezone_change">
                        <Accordion.Control icon={<IconClock size={16} />}>
                            {timezoneChangeTitle}
                        </Accordion.Control>
                        <Accordion.Panel>
                            {renderTimezoneChangeCard()}
                        </Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item value="password_reset">
                        <Accordion.Control icon={<IconKey size={16} />}>
                            {passwordResetTitle}
                        </Accordion.Control>
                        <Accordion.Panel>
                            {renderPasswordChangeCard()}
                        </Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item value="account_delete">
                        <Accordion.Control icon={<IconTrash size={16} />}>
                            <Text c="red">{deleteTitle}</Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                            {renderAccountDeletionCard()}
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            ) : (
                renderGridLayout()
            )}

            {/* Delete Account Modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title={deleteTitle}
                centered
            >
                <Stack gap="md">
                    <Alert color="red" icon={<IconAlertTriangle size={16} />}>
                        <Text fw={500}>Warning: This action cannot be undone!</Text>
                        <HtmlContent html={deleteModalWarning} className="mb-md text-dimmed" />
                    </Alert>

                    <TextInput
                        label={deleteLabelEmail}
                        placeholder={deletePlaceholderEmail}
                        value={deleteForm.email}
                        onChange={(e) => setDeleteForm(prev => ({ ...prev, email: e.target.value }))}
                        error={deleteForm.error}
                        disabled={deleteForm.isSubmitting}
                    />

                    {deleteForm.success && (
                        <Alert color="green" icon={<IconCheck size={16} />}>
                            {deleteForm.success}
                        </Alert>
                    )}

                    <Group>
                        <Button
                            color="red"
                            loading={deleteForm.isSubmitting}
                            onClick={handleDeleteAccount}
                        >
                            {deleteButton}
                        </Button>
                        <Button
                            variant="light"
                            onClick={() => setDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default ProfileStyle;
