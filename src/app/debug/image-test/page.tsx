'use client';

import React from 'react';
import { Container, Title, Text, Divider, Switch, Group, Paper } from '@mantine/core';
import { IImageStyle } from '../../../types/common/styles.types';
import ImageStyle from '../../components/frontend/styles/ImageStyle';

/**
 * Test page for ImageStyle component
 * Demonstrates both Mantine and fallback image modes
 */
export default function ImageTestPage() {
    // Mock image style data for testing
    const createImageStyle = (useMantine: boolean, useExternalUrl?: boolean): IImageStyle => ({
        id: 1,
        id_styles: 1,
        style_name: 'image' as const,
        can_have_children: 0,
        position: 1,
        path: '1',
        children: [],
        name: { content: 'Test Image' },
        section_data: [],
        fields: {
            img_src: { content: useExternalUrl
                ? 'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-7.png'
                : 'uploads/assets/general/Buch.jpg' },
            alt: { content: useExternalUrl
                ? 'Mantine demo background image from GitHub'
                : 'Sample image for testing' },
            mantine_image_fit: { content: 'cover' },
            mantine_width: { content: '400px' },
            mantine_height: { content: '300px' },
            mantine_radius: { content: 'md' },
            use_mantine_style: { content: useMantine ? '1' : '0' }
        },
        condition: null,
        css: null,
        css_mobile: null,
        debug: null,
        data_config: null
    });

    const [useMantine, setUseMantine] = React.useState(true);
    const [useExternalUrl, setUseExternalUrl] = React.useState(false);
    const imageStyle = createImageStyle(useMantine, useExternalUrl);

    return (
        <Container size="lg" py="xl">
            <Title order={1} mb="lg">ImageStyle Component Test</Title>

            <Text mb="md" size="lg">
                This page tests the ImageStyle component with both Mantine and fallback modes.
            </Text>

            <Paper shadow="sm" p="md" mb="lg">
                <Group mb="md">
                    <Text size="sm" fw={500}>Current Mode:</Text>
                    <Text size="sm" c={useMantine ? 'blue' : 'green'}>
                        {useMantine ? 'Mantine Image Component' : 'Standard HTML Image'}
                    </Text>
                </Group>

                <Group mb="md">
                    <Text size="sm">Toggle between Mantine and Fallback modes:</Text>
                    <Switch
                        checked={useMantine}
                        onChange={(event) => setUseMantine(event.currentTarget.checked)}
                        label={useMantine ? 'Mantine Mode' : 'Fallback Mode'}
                    />
                </Group>

                <Group mb="md">
                    <Text size="sm">Toggle between Local and External URLs:</Text>
                    <Switch
                        checked={useExternalUrl}
                        onChange={(event) => setUseExternalUrl(event.currentTarget.checked)}
                        label={useExternalUrl ? 'External URL' : 'Local Path'}
                    />
                </Group>
            </Paper>

            <Divider my="lg" />

            <Title order={2} mb="md">Rendered Image</Title>

            <Paper shadow="sm" p="md" mb="lg">
                <Text size="sm" mb="sm" fw={500}>
                    This image is rendered using: {useMantine ? 'Mantine Image component' : 'Standard HTML img element'}
                </Text>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ImageStyle style={imageStyle} />
                </div>
            </Paper>

            <Divider my="lg" />

            <Title order={3} mb="md">Technical Details</Title>

            <Paper shadow="sm" p="md">
                <Text size="sm" mb="xs">
                    <strong>Image Source:</strong> {useExternalUrl
                        ? 'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-7.png'
                        : 'uploads/assets/general/Buch.jpg'}
                </Text>
                <Text size="sm" mb="xs">
                    <strong>Source Type:</strong> {useExternalUrl ? 'External URL' : 'Local Asset'}
                </Text>
                <Text size="sm" mb="xs">
                    <strong>Alt Text:</strong> {useExternalUrl
                        ? 'Mantine demo background image from GitHub'
                        : 'Sample image for testing'}
                </Text>
                <Text size="sm" mb="xs">
                    <strong>Object Fit:</strong> cover
                </Text>
                <Text size="sm" mb="xs">
                    <strong>Dimensions:</strong> 400px × 300px
                </Text>
                <Text size="sm" mb="xs">
                    <strong>Border Radius:</strong> md
                </Text>
                <Text size="sm" mb="xs">
                    <strong>Use Mantine Style:</strong> {useMantine ? 'Yes (1)' : 'No (0)'}
                </Text>
            </Paper>

            <Text size="sm" mt="lg" c="dimmed">
                This test demonstrates that the ImageStyle component correctly switches between
                the Mantine Image component and a standard HTML img element based on the
                use_mantine_style field value.
            </Text>
        </Container>
    );
}
