/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import {
    Stack,
    Group,
    TextInput,
    NumberInput,
    Switch,
    Radio,
    Button,
    ActionIcon,
    Alert,
    Text,
    Code,
    Badge,
    Box,
    Paper,
    Tooltip,
    Accordion,
    ThemeIcon,
    Table,
} from '@mantine/core';
import {
    IconPlus,
    IconTrash,
    IconAlertTriangle,
    IconInfoCircle,
    IconRouteOff,
    IconHelpCircle,
    IconWorldWww,
    IconStar,
    IconToggleRight,
    IconSortAscending,
    IconAdjustments,
} from '@tabler/icons-react';
import React, { useMemo } from 'react';
import { type IPageRouteItem } from '../../../../../types/common/pages.type';

interface PageRoutesPanelProps {
    routes: IPageRouteItem[];
    onChange: (routes: IPageRouteItem[]) => void;
}

/** Collapse every `{placeholder}` to a wildcard (mirrors the backend RouteConflictValidator::shape). */
function routeShape(pattern: string): string {
    return pattern.replace(/\{[^}]+\}/g, '{*}');
}

/** Extract `{name}` placeholders from a path pattern. */
function extractPlaceholders(pattern: string): string[] {
    const out: string[] = [];
    const re = /\{([^}]+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(pattern)) !== null) {
        if (!out.includes(match[1])) {
            out.push(match[1]);
        }
    }
    return out;
}

interface IRouteConflict {
    index: number;
    message: string;
}

/**
 * Client-side mirror of the backend global conflict validator, but scoped to
 * THIS page's own active routes (the server still enforces global uniqueness on
 * save). Catches duplicate patterns and ambiguous same-shape patterns early so
 * the editor sees a hint before the save round-trip.
 */
function detectConflicts(routes: IPageRouteItem[]): IRouteConflict[] {
    const conflicts: IRouteConflict[] = [];
    const seenExact = new Map<string, number>();
    const seenShape = new Map<string, { index: number; pattern: string }>();

    routes.forEach((route, index) => {
        if (!route.is_active) return;
        const pattern = route.path_pattern.trim();
        if (pattern === '') return;
        const shape = routeShape(pattern);

        const exactOwner = seenExact.get(pattern);
        if (exactOwner !== undefined) {
            conflicts.push({
                index,
                message: `Duplicate pattern "${pattern}" (also row ${exactOwner + 1}).`,
            });
        } else {
            seenExact.set(pattern, index);
        }

        const shapeOwner = seenShape.get(shape);
        if (shapeOwner && shapeOwner.pattern !== pattern) {
            conflicts.push({
                index,
                message: `Ambiguous with "${shapeOwner.pattern}" (row ${shapeOwner.index + 1}) — same path shape.`,
            });
        } else if (!shapeOwner) {
            seenShape.set(shape, { index, pattern });
        }
    });

    return conflicts;
}

const REQUIREMENT_HINTS: Record<string, string> = {
    token: '[A-Za-z0-9._~-]+',
};

function suggestRequirement(placeholder: string): string {
    if (REQUIREMENT_HINTS[placeholder]) return REQUIREMENT_HINTS[placeholder];
    if (placeholder.endsWith('_id') || placeholder === 'id') return '\\d+';
    return '[^/]+';
}

/**
 * Editable "locked" Routes panel for the page inspector (issue #30). Edits the
 * full desired set of DB-driven public routes for one page: pattern, canonical
 * (exactly one), active flag, priority, and per-placeholder regex requirements.
 * Wired to `pageData.routes` on save; the backend syncs create/update/delete.
 */
export const PageRoutesPanel = React.memo(function PageRoutesPanel({
    routes,
    onChange,
}: PageRoutesPanelProps) {
    const conflicts = useMemo(() => detectConflicts(routes), [routes]);
    const conflictsByIndex = useMemo(() => {
        const map = new Map<number, string[]>();
        conflicts.forEach((c) => {
            const list = map.get(c.index) ?? [];
            list.push(c.message);
            map.set(c.index, list);
        });
        return map;
    }, [conflicts]);

    const hasActiveRoute = useMemo(
        () => routes.some((r) => r.is_active && r.path_pattern.trim() !== ''),
        [routes]
    );

    const updateRoute = (index: number, patch: Partial<IPageRouteItem>) => {
        onChange(routes.map((route, i) => (i === index ? { ...route, ...patch } : route)));
    };

    const setCanonical = (index: number) => {
        onChange(routes.map((route, i) => ({ ...route, is_canonical: i === index })));
    };

    const setRequirement = (index: number, placeholder: string, value: string) => {
        const route = routes[index];
        const requirements: Record<string, string> = { ...(route.requirements ?? {}) };
        if (value.trim() === '') {
            delete requirements[placeholder];
        } else {
            requirements[placeholder] = value;
        }
        updateRoute(index, {
            requirements: Object.keys(requirements).length > 0 ? requirements : null,
        });
    };

    const addRoute = () => {
        onChange([
            ...routes,
            {
                id: null,
                path_pattern: '',
                requirements: null,
                is_canonical: routes.length === 0,
                is_active: true,
                priority: 0,
            },
        ]);
    };

    const removeRoute = (index: number) => {
        const next = routes.filter((_, i) => i !== index);
        // Keep exactly one canonical among the remaining active routes.
        if (!next.some((r) => r.is_canonical && r.is_active)) {
            const firstActive = next.findIndex((r) => r.is_active);
            if (firstActive >= 0) {
                next[firstActive] = { ...next[firstActive], is_canonical: true };
            }
        }
        onChange(next);
    };

    return (
        <Stack gap="md">
            <Alert
                icon={<IconInfoCircle size="1rem" />}
                color="blue"
                variant="light"
            >
                <Text size="sm">
                    A <Text span fw={600}>route</Text> is the web address people use to open
                    this page (for example <Code>/team</Code> opens it at
                    {' '}<Code>yoursite.com/team</Code>). Most pages need just one. Not sure what
                    to do? Open the guide below — it explains everything in plain words.
                </Text>
            </Alert>

            <Accordion variant="contained">
                <Accordion.Item value="guide">
                    <Accordion.Control icon={<IconHelpCircle size="1.1rem" color="var(--mantine-color-blue-6)" />}>
                        <Text fw={600} size="sm">How web addresses work — a quick guide</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <Stack gap="md">
                            <Box>
                                <Group gap="xs" mb={4}>
                                    <ThemeIcon variant="light" size="sm" color="blue"><IconWorldWww size="0.8rem" /></ThemeIcon>
                                    <Text fw={600} size="sm">The address (path pattern)</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    This is the part after your website name. It always starts with a
                                    slash <Code>/</Code>. Use simple lowercase words and join them with
                                    hyphens — for example <Code>/about-us</Code>, <Code>/team</Code>, or{' '}
                                    <Code>/news</Code>. Avoid spaces and capital letters.
                                </Text>
                            </Box>

                            <Box>
                                <Group gap="xs" mb={4}>
                                    <ThemeIcon variant="light" size="sm" color="grape"><IconAdjustments size="0.8rem" /></ThemeIcon>
                                    <Text fw={600} size="sm">Addresses that change (placeholders)</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    Sometimes one page shows many things — like a different team member
                                    for each address. Put a word in curly braces to capture the part that
                                    changes: <Code>/team/{'{record_id}'}</Code>. Now <Code>/team/5</Code> and{' '}
                                    <Code>/team/42</Code> both open this page, and the page knows which one
                                    to show. Inside the page you can print that value with{' '}
                                    <Code>{'{{record_id}}'}</Code>.
                                </Text>
                            </Box>

                            <Box>
                                <Group gap="xs" mb={4}>
                                    <ThemeIcon variant="light" size="sm" color="yellow"><IconStar size="0.8rem" /></ThemeIcon>
                                    <Text fw={600} size="sm">Canonical — the main address</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    If a page has more than one address, pick <Text span fw={600}>one</Text> as
                                    the canonical (official) one. That is the address used in menus, shared
                                    links, and by search engines. There is always exactly one.
                                </Text>
                            </Box>

                            <Box>
                                <Group gap="xs" mb={4}>
                                    <ThemeIcon variant="light" size="sm" color="teal"><IconToggleRight size="0.8rem" /></ThemeIcon>
                                    <Text fw={600} size="sm">Active — turn an address on or off</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    Only <Text span fw={600}>active</Text> addresses actually work. Switch one
                                    off to retire an old address without deleting it — handy if you want to
                                    bring it back later.
                                </Text>
                            </Box>

                            <Box>
                                <Group gap="xs" mb={4}>
                                    <ThemeIcon variant="light" size="sm" color="indigo"><IconSortAscending size="0.8rem" /></ThemeIcon>
                                    <Text fw={600} size="sm">Priority — which address wins</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    If two addresses could both match what a visitor typed, the one with the
                                    higher priority is used. You can almost always leave this at{' '}
                                    <Code>0</Code>.
                                </Text>
                            </Box>

                            <Box>
                                <Group gap="xs" mb={4}>
                                    <ThemeIcon variant="light" size="sm" color="gray"><IconAdjustments size="0.8rem" /></ThemeIcon>
                                    <Text fw={600} size="sm">Parameter rules (advanced — optional)</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    For each placeholder you can add a rule about what it accepts — for
                                    example numbers only. If you are unsure, leave it blank and it accepts
                                    any normal value.
                                </Text>
                            </Box>

                            <Box>
                                <Text fw={600} size="sm" mb={4}>Examples</Text>
                                <Table withTableBorder withColumnBorders fz="xs">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>You want…</Table.Th>
                                            <Table.Th>Use this address</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        <Table.Tr>
                                            <Table.Td>A simple page</Table.Td>
                                            <Table.Td><Code>/about-us</Code></Table.Td>
                                        </Table.Tr>
                                        <Table.Tr>
                                            <Table.Td>One page per item (e.g. team member)</Table.Td>
                                            <Table.Td><Code>/team/{'{record_id}'}</Code></Table.Td>
                                        </Table.Tr>
                                        <Table.Tr>
                                            <Table.Td>A section under another page</Table.Td>
                                            <Table.Td><Code>/help/getting-started</Code></Table.Td>
                                        </Table.Tr>
                                    </Table.Tbody>
                                </Table>
                            </Box>
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>

            {!hasActiveRoute && (
                <Alert
                    icon={<IconRouteOff size="1rem" />}
                    color="orange"
                    variant="light"
                    title="This page has no working address yet"
                >
                    <Text size="sm">
                        Until you add an address and switch it <Text span fw={600}>Active</Text>,
                        visitors cannot reach this page by URL. Click{' '}
                        <Text span fw={600}>Add route</Text> below, type something like{' '}
                        <Code>/{'{my-page}'}</Code>, and leave <Text span fw={600}>Active</Text> on.
                    </Text>
                </Alert>
            )}

            {routes.map((route, index) => {
                const placeholders = extractPlaceholders(route.path_pattern);
                const rowConflicts = conflictsByIndex.get(index) ?? [];
                return (
                    <Paper key={route.id ?? `new-${index}`} p="sm" withBorder>
                        <Stack gap="xs">
                            <Group align="flex-end" gap="sm" wrap="nowrap">
                                <TextInput
                                    label="Path pattern"
                                    placeholder="/team/{record_id}"
                                    value={route.path_pattern}
                                    onChange={(e) =>
                                        updateRoute(index, { path_pattern: e.currentTarget.value })
                                    }
                                    error={rowConflicts.length > 0 ? rowConflicts[0] : undefined}
                                    style={{ flex: 1 }}
                                    leftSection={<IconInfoCircle size="0.85rem" />}
                                />
                                <NumberInput
                                    label="Priority"
                                    value={route.priority}
                                    onChange={(value) =>
                                        updateRoute(index, {
                                            priority: typeof value === 'number' ? value : 0,
                                        })
                                    }
                                    w={90}
                                    allowDecimal={false}
                                />
                                <Tooltip label="Delete route" position="top">
                                    <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        onClick={() => removeRoute(index)}
                                        mb={4}
                                        aria-label="Delete route"
                                    >
                                        <IconTrash size="1rem" />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>

                            <Group gap="lg">
                                <Radio
                                    label="Canonical"
                                    checked={route.is_canonical}
                                    onChange={() => setCanonical(index)}
                                    disabled={!route.is_active}
                                />
                                <Switch
                                    label="Active"
                                    checked={route.is_active}
                                    onChange={(e) =>
                                        updateRoute(index, { is_active: e.currentTarget.checked })
                                    }
                                />
                                {route.is_canonical && (
                                    <Badge color="blue" variant="light" size="sm">
                                        Canonical URL
                                    </Badge>
                                )}
                            </Group>

                            {placeholders.length > 0 && (
                                <Box>
                                    <Text size="xs" c="dimmed" mb={4}>
                                        Parameter rules (optional — leave blank to accept any value)
                                    </Text>
                                    <Stack gap={6}>
                                        {placeholders.map((placeholder) => (
                                            <Group key={placeholder} gap="xs" wrap="nowrap">
                                                <Code>{placeholder}</Code>
                                                <TextInput
                                                    size="xs"
                                                    placeholder={suggestRequirement(placeholder)}
                                                    value={route.requirements?.[placeholder] ?? ''}
                                                    onChange={(e) =>
                                                        setRequirement(
                                                            index,
                                                            placeholder,
                                                            e.currentTarget.value
                                                        )
                                                    }
                                                    style={{ flex: 1 }}
                                                />
                                            </Group>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </Paper>
                );
            })}

            {conflicts.length > 0 && (
                <Alert
                    icon={<IconAlertTriangle size="1rem" />}
                    color="red"
                    variant="light"
                    title="Route conflicts"
                >
                    Resolve the highlighted conflicts before saving. The server also rejects
                    patterns that clash with other pages.
                </Alert>
            )}

            <Group>
                <Button
                    leftSection={<IconPlus size="1rem" />}
                    variant="light"
                    onClick={addRoute}
                >
                    Add route
                </Button>
            </Group>
        </Stack>
    );
});
