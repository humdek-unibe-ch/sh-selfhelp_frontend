/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container, Paper, ThemeIcon, Title, Text, Button } from '@mantine/core';
import { IconCompass, IconHome } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { IMissingStyle } from '../../../../shared';
import { ROUTES } from '../../../../config/routes.config';
import { stripHtmlTags } from '../../../../utils/html-sanitizer.utils';

interface IMissingStyleProps {
    style: IMissingStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

const MissingStyle: React.FC<IMissingStyleProps> = ({ style, styleProps, cssClass }) => {
    const router = useRouter();

    const title = style.title?.content || 'Page not found';
    const message = style.message?.content || 'The page you are looking for does not exist or has been moved. Please check the URL or head back to the home page.';
    const buttonLabel = stripHtmlTags(style.button_label?.content || 'Back to home');
    const color = style.mantine_color?.content || 'gray';
    const radius = style.mantine_radius?.content || 'md';
    const shadow = style.mantine_shadow?.content || undefined;
    const buttonVariant = style.mantine_button_variant?.content || 'filled';
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
                <div className="flex justify-center">
                    <Button
                        variant={buttonVariant}
                        color={color}
                        size="md"
                        leftSection={<IconHome size={16} />}
                        onClick={() => router.push(ROUTES.HOME)}
                    >
                        {buttonLabel}
                    </Button>
                </div>
            </Paper>
        </Container>
    );
};

export default MissingStyle;
