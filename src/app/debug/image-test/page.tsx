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
    const createImageStyle = (useMantine: boolean): IImageStyle => ({
        id: 1,
        name: 'Test Image',
        style_name: 'image',
        can_have_children: false,
        fields: [
            {
                id: 1,
                name: 'mantine_image_src',
                value: 'https://placekitten.com/400/300',
                display: 0
            },
            {
                id: 2,
                name: 'mantine_image_alt',
                value: 'Sample kitten image for testing',
                display: 1
            },
            {
                id: 3,
                name: 'mantine_image_fit',
                value: 'cover',
                display: 0
            },
            {
                id: 4,
                name: 'mantine_width',
                value: '400px',
                display: 0
            },
            {
                id: 5,
                name: 'mantine_height',
                value: '300px',
                display: 0
            },
            {
                id: 6,
                name: 'mantine_radius',
                value: 'md',
                display: 0
            },
            {
                id: 7,
                name: 'use_mantine_style',
                value: useMantine ? '1' : '0',
                display: 0
            }
        ]
    });

    const [useMantine, setUseMantine] = React.useState(true);
    const imageStyle = createImageStyle(useMantine);

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
                    <strong>Image Source:</strong> https://placekitten.com/400/300
                </Text>
                <Text size="sm" mb="xs">
                    <strong>Alt Text:</strong> Sample kitten image for testing
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
