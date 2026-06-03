/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container, Paper, ThemeIcon, Title, Text, Button } from '@mantine/core';
import { IconCompass, IconHome } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../../../config/routes.config';

const MissingStyle: React.FC = () => {
    const router = useRouter();

    return (
        <Container size="sm" py="xl">
            <Paper withBorder radius="md" px="xl" py="xl" className="max-w-xl mx-auto my-16">
                <div className="flex justify-center mb-4">
                    <ThemeIcon variant="light" color="gray" size={64} radius="xl">
                        <IconCompass size={32} />
                    </ThemeIcon>
                </div>
                <Title order={2} ta="center" mb="sm">Page not found</Title>
                <Text ta="center" c="dimmed" mb="xl">
                    The page you are looking for does not exist or has been moved. Please check the URL or head back to the home page.
                </Text>
                <div className="flex justify-center">
                    <Button
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

export default MissingStyle;
