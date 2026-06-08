/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container, Paper, ThemeIcon, Title, Text, Button, Group } from '@mantine/core';
import { IconCompass, IconHome, IconLogin } from '@tabler/icons-react';
import Link from 'next/link';
import { ROUTES } from '../../../../config/routes.config';
import { stripHtmlTags } from '../../../../utils/html-sanitizer.utils';

// Inline CMS-style contract. These fields will be moved to `@selfhelp/shared`
// (`INotFoundStyle`) and the backend field catalog later; kept inline here so
// the component is already configuration-ready.
interface IContentField {
    content?: string;
}

interface INotFoundStyle {
    title?: IContentField;
    message?: IContentField;
    button_label?: IContentField;
    login_label?: IContentField;
    mantine_color?: IContentField;
    mantine_radius?: IContentField;
    mantine_shadow?: IContentField;
    mantine_button_variant?: IContentField;
    show_icon?: IContentField;
}

interface INotFoundStyleProps {
    style: INotFoundStyle;
    styleProps: Record<string, any>;
    cssClass: string;
    /**
     * The 404 route is served outside the CMS, so it cannot rely on the user
     * session being in React Query. The Server Component reads the auth cookie
     * and hands a plain boolean down to toggle the "Sign in" call to action.
     */
    isAuthenticated?: boolean;
}

const NotFoundStyle: React.FC<INotFoundStyleProps> = ({ style, styleProps, cssClass, isAuthenticated = false }) => {
    const title = style.title?.content || 'Page not found';
    const message = style.message?.content || 'The page you are looking for does not exist or has been moved.';
    const buttonLabel = stripHtmlTags(style.button_label?.content || 'Back to home');
    const loginLabel = stripHtmlTags(style.login_label?.content || 'Sign in');
    const color = style.mantine_color?.content || 'gray';
    const radius = style.mantine_radius?.content || 'md';
    const shadow = style.mantine_shadow?.content || undefined;
    const buttonVariant = style.mantine_button_variant?.content || (isAuthenticated ? 'filled' : 'light');
    const showIcon = style.show_icon?.content !== '0';

    return (
        <Container size="sm" py="xl">
            <Paper withBorder radius={radius} shadow={shadow} px="xl" py="xl" {...styleProps} className={`max-w-xl mx-auto my-16 ${cssClass}`}>
                {showIcon && (
                    <div className="flex justify-center mb-4">
                        <ThemeIcon variant="light" color={color} size={64} radius="xl">
                            <IconCompass size={32} />
                        </ThemeIcon>
                    </div>
                )}
                <Title order={2} ta="center" mb="sm">{title}</Title>
                <Text ta="center" c="dimmed" mb="xl">{message}</Text>
                <Group justify="center">
                    <Button
                        component={Link}
                        href={ROUTES.HOME}
                        size="md"
                        variant={buttonVariant}
                        color={color}
                        leftSection={<IconHome size={16} />}
                    >
                        {buttonLabel}
                    </Button>
                    {!isAuthenticated && (
                        <Button
                            component={Link}
                            href={ROUTES.LOGIN}
                            size="md"
                            color={color}
                            leftSection={<IconLogin size={16} />}
                        >
                            {loginLabel}
                        </Button>
                    )}
                </Group>
            </Paper>
        </Container>
    );
};

export default NotFoundStyle;
