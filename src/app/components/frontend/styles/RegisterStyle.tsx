/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState, useEffect } from 'react';
import { TextInput, Button, Paper, Title, Alert, Stack, Text, Group } from '@mantine/core';
import { IconCheck, IconExclamationCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { IRegisterStyle } from '../../../../types/common/styles.types';
import { IContentField } from '../../../../shared';
import { usePageContext } from '../../contexts/PageContext';
import { useRegisterMutation } from '../../../../hooks/mutations/useRegisterMutation';
import { useAuth } from '../../../../hooks/useAuth';
import { ROUTES } from '../../../../config/routes.config';

// Fields present in the backend response but not yet in the shared IRegisterStyle type.
// TODO: Later add to the shared instead of extend
interface IRegisterStyleExtended extends IRegisterStyle {
    open_registration?: IContentField<string>;
    anonymous_users_registration?: IContentField<string>;
}

/**
 * Props interface for RegisterStyle component
 */
interface IRegisterStyleProps {
    style: IRegisterStyleExtended;
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
    const { isAuthenticated, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');

    // Extract field values from style props
    const title = style.title?.content || 'Registration';
    const labelUser = style.label_user?.content || 'Email';
    const labelSubmit = style.label_submit?.content || 'Register';
    const alertFail = style.alert_fail?.content || 'Registration failed. Please check your details and try again.';
    const alertSuccess = style.alert_success?.content || 'Registration successful! Please check your email for an activation link.';

    // open_registration === '0' means registration requires an invitation code.
    // These fields come from the backend but are not yet in the shared IRegisterStyle type.
    const requiresCode = style.open_registration?.content === '0';
    const anonymousUsersText = style.anonymous_users_registration?.content;

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!pageContext) return;

        register.mutate({
            page_id: pageContext.pageId,
            email,
            ...(requiresCode && code ? { code } : {}),
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

                    {!requiresCode && anonymousUsersText && (
                        <Text size="sm" c="dimmed">
                            {anonymousUsersText}
                        </Text>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        size="md"
                        loading={register.isPending}
                    >
                        {labelSubmit}
                    </Button>
                </Stack>
            </form>
        </Paper>
    );
};

export default RegisterStyle;
