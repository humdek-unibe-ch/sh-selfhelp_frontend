/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container, Paper, ThemeIcon, Title, Text, Button } from '@mantine/core';
import { IconLock, IconHome } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../../../config/routes.config';

interface INoAccessStyleProps {
    title?: string;
    message?: string;
}

const NoAccessStyle: React.FC<INoAccessStyleProps> = ({
    title = 'Access denied',
    message = 'Your account does not have permission to view this page. If you think this is a mistake, please contact the research team or your administrator.',
}) => {
    const router = useRouter();

    return (
        <Container size="sm" py="xl">
            <Paper withBorder radius="md" px="xl" py="xl" className="max-w-xl mx-auto my-16">
                <div className="flex justify-center mb-4">
                    <ThemeIcon variant="light" color="red" size={64} radius="xl">
                        <IconLock size={32} />
                    </ThemeIcon>
                </div>
                <Title order={2} ta="center" mb="sm">{title}</Title>
                <Text ta="center" c="dimmed" mb="xl">{message}</Text>
                <div className="flex justify-center">
                    <Button
                        variant="light"
                        size="md"
                        leftSection={<IconHome size={16} />}
                        onClick={() => router.push(ROUTES.HOME)}
                    >
                        Back to home
                    </Button>
                </div>
            </Paper>
        </Container>
    );
};

export default NoAccessStyle;
