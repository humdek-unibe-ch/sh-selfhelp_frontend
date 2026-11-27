/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import {
    Alert,
    Button,
    Group,
    Loader,
    NumberInput,
    PasswordInput,
    Stack,
    Switch,
    Text,
    TextInput,
} from '@mantine/core';
import type { IPluginSettingViewItem } from '@selfhelp/shared/plugin-sdk';
import { usePluginSettings, useUpdatePluginSettings } from '../hooks/usePluginJobTypes';

interface IPluginSettingsFormProps {
    pluginId: string;
}

type TDraftValue = string | number | boolean | null | undefined;

/**
 * Admin settings form generated from C14 GET items.
 * Secrets left out of the PUT body are kept; `null` clears; env-overridden fields are read-only.
 */
export function PluginSettingsForm({ pluginId }: IPluginSettingsFormProps) {
    const { data: items, isLoading, error } = usePluginSettings(pluginId, true);
    const save = useUpdatePluginSettings(pluginId);
    const [draft, setDraft] = useState<Record<string, TDraftValue>>({});
    const [clearedSecrets, setClearedSecrets] = useState<Record<string, boolean>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const rows = items ?? [];

    if (isLoading) {
        return (
            <Stack align="center" py="md">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">Loading settings…</Text>
            </Stack>
        );
    }

    if (error) {
        return (
            <Alert color="red" title="Could not load settings">
                {error instanceof Error ? error.message : String(error)}
            </Alert>
        );
    }

    if (rows.length === 0) {
        return <Text c="dimmed" size="sm">This plugin has no host-managed settings.</Text>;
    }

    const setField = (item: IPluginSettingViewItem, value: TDraftValue) => {
        setTouched((prev) => ({ ...prev, [item.key]: true }));
        setDraft((prev) => ({ ...prev, [item.key]: value }));
        if (item.secret) {
            setClearedSecrets((prev) => ({ ...prev, [item.key]: value === null }));
        }
    };

    const currentValue = (item: IPluginSettingViewItem): TDraftValue => {
        if (Object.prototype.hasOwnProperty.call(draft, item.key)) {
            return draft[item.key];
        }
        if (item.secret) return '';
        return item.value;
    };

    const onSave = () => {
        const values: Record<string, string | number | boolean | null> = {};
        for (const item of rows) {
            if (item.overridden_by_env) continue;
            if (item.secret) {
                if (clearedSecrets[item.key]) {
                    values[item.key] = null;
                    continue;
                }
                if (!touched[item.key]) {
                    // Leave out → server keeps the secret.
                    continue;
                }
                const v = draft[item.key];
                if (typeof v === 'string' && v.trim() === '') {
                    continue;
                }
                if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
                    values[item.key] = v;
                }
                continue;
            }
            if (!touched[item.key]) continue;
            const v = draft[item.key];
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
                values[item.key] = v;
            }
        }
        save.mutate(values, {
            onSuccess: () => {
                setDraft({});
                setTouched({});
                setClearedSecrets({});
            },
        });
    };

    return (
        <Stack gap="md" data-testid="plugin-settings-form">
            {rows.map((item) => {
                const overridden = item.overridden_by_env;
                const label = item.label || item.key;
                const value = currentValue(item);

                if (item.type === 'boolean') {
                    return (
                        <Stack key={item.key} gap={4}>
                            <Switch
                                label={label}
                                checked={Boolean(value)}
                                onChange={(e) => setField(item, e.currentTarget.checked)}
                                disabled={overridden || save.isPending}
                            />
                            {overridden && (
                                <Text size="xs" c="dimmed">Overridden by environment variable; change it there.</Text>
                            )}
                        </Stack>
                    );
                }

                if (item.type === 'number') {
                    return (
                        <Stack key={item.key} gap={4}>
                            <NumberInput
                                label={label}
                                value={typeof value === 'number' ? value : value === '' || value == null ? '' : Number(value)}
                                onChange={(v) => setField(item, v === '' ? null : Number(v))}
                                disabled={overridden || save.isPending}
                                required={item.required && !overridden}
                            />
                            {overridden && (
                                <Text size="xs" c="dimmed">Overridden by environment variable; change it there.</Text>
                            )}
                        </Stack>
                    );
                }

                if (item.secret) {
                    const hint = item.hint ? `Key: …${item.hint}` : item.has_value ? 'Key: set' : 'Key: not set';
                    return (
                        <Stack key={item.key} gap={4}>
                            <PasswordInput
                                label={label}
                                description={`${hint}. Leave empty to keep.`}
                                value={typeof value === 'string' ? value : ''}
                                onChange={(e) => setField(item, e.currentTarget.value)}
                                disabled={overridden || save.isPending}
                                required={item.required && !item.has_value && !overridden}
                            />
                            <Group gap="xs">
                                <Button
                                    size="xs"
                                    variant="subtle"
                                    color="red"
                                    disabled={overridden || save.isPending || (!item.has_value && !clearedSecrets[item.key])}
                                    onClick={() => setField(item, null)}
                                >
                                    Clear secret
                                </Button>
                                {clearedSecrets[item.key] && (
                                    <Text size="xs" c="orange">Will clear on save</Text>
                                )}
                            </Group>
                            {overridden && (
                                <Text size="xs" c="dimmed">Overridden by environment variable; change it there.</Text>
                            )}
                        </Stack>
                    );
                }

                return (
                    <Stack key={item.key} gap={4}>
                        <TextInput
                            label={label}
                            value={typeof value === 'string' ? value : value == null ? '' : String(value)}
                            onChange={(e) => setField(item, e.currentTarget.value)}
                            disabled={overridden || save.isPending}
                            required={item.required && !overridden}
                            type={item.type === 'url' ? 'url' : 'text'}
                        />
                        {overridden && (
                            <Text size="xs" c="dimmed">Overridden by environment variable; change it there.</Text>
                        )}
                    </Stack>
                );
            })}

            <Group>
                <Button onClick={onSave} loading={save.isPending}>
                    Save settings
                </Button>
            </Group>
        </Stack>
    );
}
