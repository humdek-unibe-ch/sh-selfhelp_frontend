/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState, useEffect } from 'react';
import { TextInput, Button, Paper, Title, Alert, Stack, Group } from '@mantine/core';
import { IconCheck, IconExclamationCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { IRegisterStyle } from '../../../../types/common/styles.types';
import { usePageContext } from '../../contexts/PageContext';
import { useRegisterMutation } from '../../../../hooks/mutations/useRegisterMutation';
import { useAuth } from '../../../../hooks/useAuth';
import { ROUTES } from '../../../../config/routes.config';
import { parseApiError } from '../../../../utils/mutation-error-handler';

/**
 * Props interface for RegisterStyle component
 */
interface IRegisterStyleProps {
    style: IRegisterStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * RegisterStyle component renders a registration form with email and an
 * optional validation code field. Password is set later on the activation page.
 * Uses Mantine UI components for consistent theming and styling.
 *
 * The backend is the source of truth for the policy: open_registration === '1'
 * is open registration (no code field, no code submitted); '0' or missing
 * requires a validation code. Any submitted code is ignored server-side in open
 * mode, but the frontend still hides the field and sends nothing to match.
 */
const RegisterStyle: React.FC<IRegisterStyleProps> = ({ style, styleProps, cssClass }) => {
    const router = useRouter();
    const pageContext = usePageContext();
    const register = useRegisterMutation();
    const { isAuthenticated, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');

    // Extract field values from style props
    const title = style.title?.content || 'Registration';
    const labelUser = style.label_user?.content || 'Email';
    const labelSubmit = style.label_submit?.content || 'Register';
    const alertFail = style.alert_fail?.content || 'Invalid email or validation code.';
    const alertSuccess = style.alert_success?.content || 'Registration successful! Please check your email for activation link.';
    const mantineColor = ((style as any).mantine_color?.content as string | undefined) || 'blue';
    const formType = style.fields?.type?.content || 'success';

    // CMS-managed labels for the previously hardcoded registration UI text.
    // The `fields` bag is dynamically typed (IContentField<unknown>), so the
    // fallback is narrowed to a string like the existing mantine_color read.
    const labelCode = style.label_code?.content ?? (style.fields?.label_code?.content as string | undefined) ?? 'Validation Code';
    const codePlaceholder = style.code_placeholder?.content ?? (style.fields?.code_placeholder?.content as string | undefined) ?? 'Enter your code';
    const labelGoHome = style.label_go_home?.content ?? (style.fields?.label_go_home?.content as string | undefined) ?? 'Go Home';
    const labelGoToLogin = style.label_go_to_login?.content ?? (style.fields?.label_go_to_login?.content as string | undefined) ?? 'Go to Login';

    // Backend is source of truth: open_registration === '1' => open registration
    // (no code). '0' or missing => a validation code is required.
    const openRegistrationValue = style.open_registration?.content ?? (style.fields?.open_registration?.content as string | undefined) ?? '0';
    const codeRequired = openRegistrationValue !== '1';

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!pageContext) return;

        register.mutate({
            page_id: pageContext.pageId,
            email,
            ...(codeRequired && code ? { code } : {}),
        });
    };

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace(ROUTES.HOME);
        }
    }, [isLoading, isAuthenticated, router]);

    if (register.isSuccess) {
        return (
            <Paper shadow="md" p="xl" radius="md" {...styleProps} className={cssClass} style={{ maxWidth: 400, margin: '0 auto' }}>
                <Stack gap="md">
                    <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                        {alertSuccess}
                    </Alert>
                    <Group grow>
                        <Button variant="light" onClick={() => router.push(ROUTES.HOME)}>
                            {labelGoHome}
                        </Button>
                        <Button onClick={() => router.push(ROUTES.LOGIN)}>
                            {labelGoToLogin}
                        </Button>
                    </Group>
                </Stack>
            </Paper>
        );
    }

    return (
        <Paper shadow="md" p="xl" radius="md" {...styleProps} className={cssClass} style={{ maxWidth: 400, margin: '0 auto' }}>
            <Title order={2} ta="center" mb="lg">
                {title}
            </Title>

            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    {register.isError && (
                        <Alert icon={<IconExclamationCircle size={16} />} color="red" variant="light">
                            {parseApiError(register.error).errorMessage || alertFail}
                        </Alert>
                    )}

                    <TextInput
                        label={labelUser}
                        placeholder={labelUser}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        size="md"
                    />

                    {codeRequired && (
                        <TextInput
                            label={labelCode}
                            placeholder={codePlaceholder}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                            size="md"
                        />
                    )}


                    <Button
                        type="submit"
                        fullWidth
                        size="md"
                        loading={register.isPending}
                        color={mantineColor}
                        variant={formType === 'success' ? 'filled' : 'light'}
                    >
                        {labelSubmit}
                    </Button>
                </Stack>
            </form>
        </Paper>
    );
};

export default RegisterStyle;
