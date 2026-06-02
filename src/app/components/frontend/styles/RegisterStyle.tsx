/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import { TextInput, Button, Paper, Title, Alert, Stack, Group } from '@mantine/core';
import { IconCheck, IconExclamationCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { IRegisterStyle } from '../../../../types/common/styles.types';
import { usePageContext } from '../../contexts/PageContext';
import { useRegisterMutation } from '../../../../hooks/mutations/useRegisterMutation';
import { ROUTES } from '../../../../config/routes.config';

/**
 * Props interface for RegisterStyle component
 */
interface IRegisterStyleProps {
    style: IRegisterStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * RegisterStyle component renders a registration form with email and optional
 * validation code fields. Password is set later on the activation page.
 * Uses Mantine UI components for consistent theming and styling.
 * open_registration.content === '0' means a code is required to register.
 */
const RegisterStyle: React.FC<IRegisterStyleProps> = ({ style, styleProps, cssClass }) => {
    const router = useRouter();
    const pageContext = usePageContext();
    const register = useRegisterMutation();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');

    // Extract field values from style props
    const title = style.title?.content || 'Registration';
    const labelUser = style.label_user?.content || 'Email';
    const labelSubmit = style.label_submit?.content || 'Register';
    const alertFail = style.alert_fail?.content || 'Invalid email or validation code.';
    const alertSuccess = style.alert_success?.content || 'Registration successful! Please check your email for activation link.';
    const successMessage = style.success?.content || 'Registration completed successfully';
    const mantineColor = ((style as any).mantine_color?.content as string | undefined) || 'blue';
    const formType = style.fields?.type?.content || 'success';
    
    // Check if open registration is enabled
    const openRegistration = style.fields?.open_registration?.content === '1';

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!pageContext) return;

        register.mutate({
            page_id: pageContext.pageId,
            email,
            ...(requiresCode && code ? { code } : {}),
        });
    };

    if (register.isSuccess) {
        return (
            <Paper shadow="md" p="xl" radius="md" {...styleProps} className={cssClass} style={{ maxWidth: 400, margin: '0 auto' }}>
                <Stack gap="md">
                    <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                        {alertSuccess}
                    </Alert>
                    <Group grow>
                        <Button variant="light" onClick={() => router.push(ROUTES.HOME)}>
                            Go Home
                        </Button>
                        <Button onClick={() => router.push(ROUTES.LOGIN)}>
                            Go to Login
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
                            {register.error instanceof Error ? register.error.message : alertFail}
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

                    {requiresCode && (
                        <TextInput
                            label="Validation Code"
                            placeholder="Enter your code"
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
                        loading={isLoading}
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
