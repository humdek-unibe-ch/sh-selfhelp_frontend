'use client';

import React from 'react';
import { Container, Title, Text, Group, Stack } from '@mantine/core';
import ActionIconStyle from '../../components/frontend/styles/mantine/ActionIconStyle';

/**
 * Test page for ActionIconStyle component
 * This page tests the new icon selection and link functionality
 */
const ActionIconTestPage = () => {
    // Mock style data for testing
    const mockActionIconStyle = {
        id: 999,
        name: 'Test ActionIcon',
        style_name: 'actionIcon' as const,
        // Basic Mantine fields
        mantine_variant: { content: 'subtle', meta: null },
        mantine_size: { content: 'md', meta: null },
        mantine_color: { content: 'blue', meta: null },
        mantine_radius: { content: 'sm', meta: null },
        disabled: { content: '0', meta: null },
        use_mantine_style: { content: '1', meta: null },
        // New fields for testing
        mantine_left_icon: { content: 'IconHome', meta: null }, // Test icon selection
        is_link: { content: '1', meta: null }, // Test link functionality
        page_keyword: { content: '/home', meta: null }, // Test internal link
        open_in_new_tab: { content: '0', meta: null }, // Test same tab
        // Additional fields
        css: '',
        fields: []
    };

    const mockActionIconWithExternalLink = {
        ...mockActionIconStyle,
        id: 1000,
        name: 'External Link ActionIcon',
        mantine_left_icon: { content: 'IconExternalLink', meta: null },
        page_keyword: { content: 'https://mantine.dev/core/action-icon', meta: null },
        open_in_new_tab: { content: '1', meta: null }, // Test new tab
    };

    const mockActionIconWithoutMantine = {
        ...mockActionIconStyle,
        id: 1001,
        name: 'Fallback ActionIcon',
        use_mantine_style: { content: '0', meta: null }, // Test fallback
        mantine_left_icon: { content: 'IconSettings', meta: null },
    };

    return (
        <Container size="lg" py="xl">
            <Stack spacing="xl">
                <div>
                    <Title order={2} mb="md">ActionIcon Style Testing</Title>
                    <Text c="dimmed" mb="lg">
                        This page tests the updated ActionIconStyle component with icon selection and link functionality.
                    </Text>
                </div>

                <div>
                    <Title order={3} mb="sm">Test 1: Basic ActionIcon with Icon and Internal Link</Title>
                    <Text c="dimmed" mb="sm">Should display with home icon and navigate to /home</Text>
                    <Group>
                        <ActionIconStyle style={mockActionIconStyle} />
                        <Text size="sm">Home Icon → Internal Link (/home)</Text>
                    </Group>
                </div>

                <div>
                    <Title order={3} mb="sm">Test 2: ActionIcon with External Link (New Tab)</Title>
                    <Text c="dimmed" mb="sm">Should display with external link icon and open Mantine docs in new tab</Text>
                    <Group>
                        <ActionIconStyle style={mockActionIconWithExternalLink} />
                        <Text size="sm">External Link Icon → New Tab (Mantine Docs)</Text>
                    </Group>
                </div>

                <div>
                    <Title order={3} mb="sm">Test 3: Fallback ActionIcon (No Mantine Styling)</Title>
                    <Text c="dimmed" mb="sm">Should display as basic button with settings icon (no Mantine styling)</Text>
                    <Group>
                        <ActionIconStyle style={mockActionIconWithoutMantine} />
                        <Text size="sm">Settings Icon → Fallback Button</Text>
                    </Group>
                </div>

                <div>
                    <Title order={3} mb="sm">Test 4: Loading State</Title>
                    <Text c="dimmed" mb="sm">Should show loading spinner when loading is enabled</Text>
                    <Group>
                        <ActionIconStyle
                            style={{
                                ...mockActionIconStyle,
                                mantine_action_icon_loading: { content: '1', meta: null }
                            }}
                        />
                        <Text size="sm">Loading State Test</Text>
                    </Group>
                </div>

                <div>
                    <Title order={3} mb="sm">Test 5: Disabled State</Title>
                    <Text c="dimmed" mb="sm">Should be disabled and have reduced opacity</Text>
                    <Group>
                        <ActionIconStyle
                            style={{
                                ...mockActionIconStyle,
                                disabled: { content: '1', meta: null }
                            }}
                        />
                        <Text size="sm">Disabled State Test</Text>
                    </Group>
                </div>

                <div>
                    <Title order={4} mt="xl" c="dimmed">Implementation Summary</Title>
                    <Text size="sm" c="dimmed">
                        ✅ Icon selection using IconComponent<br/>
                        ✅ Link functionality with internal/external URL support<br/>
                        ✅ Open in new tab support<br/>
                        ✅ Fallback to basic button when Mantine styling disabled<br/>
                        ✅ Loading and disabled states<br/>
                        ✅ Proper TypeScript interfaces and field mappings
                    </Text>
                </div>
            </Stack>
        </Container>
    );
};

export default ActionIconTestPage;
