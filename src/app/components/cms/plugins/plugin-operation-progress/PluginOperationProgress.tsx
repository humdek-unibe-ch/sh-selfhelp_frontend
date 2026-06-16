/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Step-tracked progress view for a single plugin operation — the CMS analogue
 * of the manager install checklist. Driven entirely by SSE-refreshed operation
 * data (status + `logs[].stage`), no polling: as the backend records stages the
 * Timeline fills in and the final step turns green (done) or red (failed).
 */

import { Badge, Group, Loader, Paper, Stack, Text, ThemeIcon, Timeline } from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconClock } from '@tabler/icons-react';
import type { IAdminPluginOperation } from '../../../../../types/responses/admin/plugins.types';
import {
    buildPluginOperationSteps,
    pluginOperationActiveIndex,
    pluginOperationStatusColor,
    type IPluginOperationStep,
    type TPluginStepState,
} from '../hooks/plugin-operation-steps';
import { isPluginOperationActive, pluginOperationBusyLabel } from '../hooks/plugin-operation-polling';

function stepColor(state: TPluginStepState): string {
    switch (state) {
        case 'done':
            return 'teal';
        case 'active':
            return 'blue';
        case 'error':
            return 'red';
        case 'pending':
        default:
            return 'gray';
    }
}

function StepBullet({ state }: { state: TPluginStepState }) {
    if (state === 'active') return <Loader size={12} color="blue" />;
    if (state === 'error') return <IconAlertTriangle size={12} />;
    if (state === 'done') return <IconCheck size={12} />;
    return <IconClock size={12} />;
}

function formatStepTime(at: string | null | undefined): string | null {
    if (!at) return null;
    const date = new Date(at);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleTimeString();
}

export function PluginOperationProgress({ operation }: { operation: IAdminPluginOperation }) {
    const steps = buildPluginOperationSteps(operation);
    const activeIndex = pluginOperationActiveIndex(steps);
    const running = isPluginOperationActive(operation.status);

    return (
        <Paper withBorder p="sm" radius="md">
            <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                        {running ? (
                            <Loader size="xs" />
                        ) : (
                            <ThemeIcon size="sm" radius="xl" variant="light" color={pluginOperationStatusColor(operation.status)}>
                                {operation.status === 'succeeded' ? <IconCheck size={14} /> : <IconAlertTriangle size={14} />}
                            </ThemeIcon>
                        )}
                        <Stack gap={0}>
                            <Text fw={600} size="sm">{operation.pluginId}</Text>
                            <Text size="xs" c="dimmed">
                                {running ? pluginOperationBusyLabel(operation.type) : `${operation.type} operation`}
                            </Text>
                        </Stack>
                    </Group>
                    <Badge
                        color={pluginOperationStatusColor(operation.status)}
                        variant="light"
                        styles={{ root: { overflow: 'visible' }, label: { overflow: 'visible' } }}
                    >
                        {operation.status}
                    </Badge>
                </Group>

                <Timeline active={activeIndex} bulletSize={18} lineWidth={2}>
                    {steps.map((step: IPluginOperationStep) => {
                        const time = formatStepTime(step.at);
                        return (
                            <Timeline.Item
                                key={step.key}
                                color={stepColor(step.state)}
                                bullet={<StepBullet state={step.state} />}
                                title={<Text size="sm">{step.label}</Text>}
                            >
                                {time && <Text size="xs" c="dimmed">{time}</Text>}
                            </Timeline.Item>
                        );
                    })}
                </Timeline>
            </Stack>
        </Paper>
    );
}

/**
 * Panel that renders one {@link PluginOperationProgress} per CURRENTLY active
 * operation (requested / running). Hidden when nothing is in flight. Mounted
 * above the plugins table so the operator always sees what is executing.
 */
export function ActivePluginOperationsPanel({
    operations,
}: {
    operations: readonly IAdminPluginOperation[] | null | undefined;
}) {
    const active = (operations ?? []).filter((op) => isPluginOperationActive(op.status));
    if (active.length === 0) return null;

    return (
        <Stack gap="xs">
            <Text fw={600} size="sm">Operations in progress</Text>
            {active.map((op) => (
                <PluginOperationProgress key={op.id} operation={op} />
            ))}
        </Stack>
    );
}
