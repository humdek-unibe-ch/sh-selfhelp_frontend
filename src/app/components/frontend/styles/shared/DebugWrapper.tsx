import React from 'react';
import { Indicator, HoverCard, Text, ScrollArea, Badge, Group, Divider, Box, useMantineColorScheme, ActionIcon } from '@mantine/core';
import { IconBug } from '@tabler/icons-react';
import { JsonEditor, githubLightTheme, githubDarkTheme } from 'json-edit-react';
import type { TStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for DebugWrapper component
 */
interface IDebugWrapperProps {
    children: React.ReactNode;
    style: TStyle;
}

/**
 * DebugWrapper component that wraps elements with debug indicators and JSON inspection
 * Uses Mantine's Indicator for clean corner positioning and minimal border styling
 */
const DebugWrapper: React.FC<IDebugWrapperProps> = ({ children, style }) => {
    const { colorScheme } = useMantineColorScheme();

    // Check if debug is enabled (debug field is truthy)
    const isDebugEnabled = style.debug && style.debug > 0;

    // If debug is not enabled, just return children
    if (!isDebugEnabled) {
        return <>{children}</>;
    }

    return (
        <Indicator
            inline
            size={16}
            offset={2}
            position="top-end"
            color='transparent'
            m="xs"
            label={
                <HoverCard shadow="md">
                    <HoverCard.Target>
                        <ActionIcon variant='filled' size='xs' color='orange'>
                            <IconBug size={10} />
                        </ActionIcon>
                    </HoverCard.Target>

                    <HoverCard.Dropdown>
                        <Group justify="space-between" mb="xs">
                            <Text size="sm" fw={600} c="orange">
                                Style Debug Info
                            </Text>
                            <Badge size="sm" variant="light" color="orange">
                                ID: {style.id}
                            </Badge>
                        </Group>

                        <Divider mb="sm" />

                        <Group mb="sm">
                            <Badge size="sm" color="orange">
                                {style.style_name}
                            </Badge>
                            {style.section_name && (
                                <Badge size="sm" variant="outline" color="orange">
                                    {style.section_name}
                                </Badge>
                            )}
                        </Group>

                        <ScrollArea h={400} type="auto">
                            <Box p="xs" style={{ fontSize: '12px' }}>
                                <JsonEditor
                                    data={style}
                                    theme={colorScheme === 'dark' ? githubDarkTheme : githubLightTheme}
                                    collapse={1}
                                    enableClipboard={true}
                                    showErrorMessages={false}
                                    viewOnly={true}
                                />
                            </Box>
                        </ScrollArea>
                    </HoverCard.Dropdown>
                </HoverCard>
            }
        >
            <Box
                style={{
                    border: '1px solid var(--mantine-color-orange-4)',
                    // borderRadius: 'var(--mantine-radius-sm)',
                }}
            >
                {children}
            </Box>
        </Indicator>
    );
};

export default DebugWrapper;
