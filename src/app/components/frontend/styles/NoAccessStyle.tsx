/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container, Paper, ThemeIcon, Title, Text, Button, Group } from '@mantine/core';
import { IconLock, IconHome, IconLogin } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../../../config/routes.config';
import { stripHtmlTags } from '../../../../utils/html-sanitizer.utils';

// Inline CMS-style contract. These fields will be moved to `@selfhelp/shared`
// (`INoAccessStyle`) and the backend field catalog later; kept inline here so
// the component is already configuration-ready.
interface IContentField {
    content?: string;
}

interface INoAccessStyle {
    title?: IContentField;
    message?: IContentField;
    button_label?: IContentField;
    login_label?: IContentField;
    show_login?: IContentField;
    mantine_color?: IContentField;
    mantine_radius?: IContentField;
    mantine_shadow?: IContentField;
    mantine_button_variant?: IContentField;
    show_icon?: IContentField;
}

interface INoAccessStyleProps {
    style: INoAccessStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

const NoAccessStyle: React.FC<INoAccessStyleProps> = ({ style, styleProps, cssClass }) => {
    const router = useRouter();

    const title = style.title?.content || 'Access denied';
    const message = style.message?.content || 'Your account does not have permission to view this page. If you think this is a mistake, please contact the research team or your administrator.';
    const buttonLabel = stripHtmlTags(style.button_label?.content || 'Back to home');
    const loginLabel = stripHtmlTags(style.login_label?.content || 'Sign in');
    const showLogin = style.show_login?.content === '1';
    const color = style.mantine_color?.content || 'red';
    const radius = style.mantine_radius?.content || 'md';
    const shadow = style.mantine_shadow?.content || undefined;
    const buttonVariant = style.mantine_button_variant?.content || 'light';
    const showIcon = style.show_icon?.content !== '0';

    return (
        <Container size="sm" py="xl">
            <Paper withBorder radius={radius} shadow={shadow} px="xl" py="xl" {...styleProps} className={`max-w-xl mx-auto my-16 ${cssClass}`}>
                {showIcon && (
                    <div className="flex justify-center mb-4">
                        <ThemeIcon variant="light" color={color} size={64} radius="xl">
                            <IconLock size={32} />
                        </ThemeIcon>
                    </div>
                )}
                <Title order={2} ta="center" mb="sm">{title}</Title>
                <Text ta="center" c="dimmed" mb="xl">{message}</Text>
                <Group justify="center">
                    <Button
                        variant={buttonVariant}
                        color={color}
                        size="md"
                        leftSection={<IconHome size={16} />}
                        onClick={() => router.push(ROUTES.HOME)}
                    >
                        {buttonLabel}
                    </Button>
                    {showLogin && (
                        <Button
                            color={color}
                            size="md"
                            leftSection={<IconLogin size={16} />}
                            onClick={() => router.push(ROUTES.LOGIN)}
                        >
                            {loginLabel}
                        </Button>
                    )}
                </Group>
            </Paper>
        </Container>
    );
};

export default NoAccessStyle;
