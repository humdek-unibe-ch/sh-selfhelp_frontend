/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo } from 'react';
import { NumberInput, Select, Stack, Switch, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import type {
    IPluginManifestJobConfigProperty,
    IPluginManifestJobConfigSchema,
} from '@selfhelp/shared/plugin-sdk';
import { AdminDataAccessApi } from '../../../../../api/admin/data-access.api';
import { TextInputWithMentions } from '../field-components/TextInputWithMentions';

export interface ISchemaConfigFormProps {
    /** Inline JSON Schema for the plugin job `plugin_config` object. */
    schema: IPluginManifestJobConfigSchema | Record<string, unknown> | null | undefined;
    /** Config property → registered resource type (C12 `resource_fields`). */
    resourceFields?: Record<string, string> | null;
    value: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
    /** Interpolation map for `format: "variable-text"` fields. */
    dataVariables?: Record<string, string>;
    disabled?: boolean;
}

function asPropertyMap(
    schema: IPluginManifestJobConfigSchema | Record<string, unknown> | null | undefined,
): Record<string, IPluginManifestJobConfigProperty> {
    if (!schema || typeof schema !== 'object') return {};
    const properties = (schema as IPluginManifestJobConfigSchema).properties;
    if (!properties || typeof properties !== 'object') return {};
    return properties;
}

function requiredKeys(
    schema: IPluginManifestJobConfigSchema | Record<string, unknown> | null | undefined,
): string[] {
    if (!schema || typeof schema !== 'object') return [];
    const required = (schema as IPluginManifestJobConfigSchema).required;
    return Array.isArray(required) ? required.filter((k): k is string => typeof k === 'string') : [];
}

function ResourcePicker({
    typeCode,
    label,
    description,
    value,
    onChange,
    required,
    disabled,
}: {
    typeCode: string;
    label: string;
    description?: string;
    value: string | null;
    onChange: (next: string | null) => void;
    required?: boolean;
    disabled?: boolean;
}) {
    const { data: options = [], isLoading } = useQuery({
        queryKey: ['admin-plugin-resources-viewable', typeCode],
        queryFn: () => AdminDataAccessApi.getPluginResources(typeCode),
        enabled: Boolean(typeCode),
        staleTime: 60_000,
    });

    const selectData = useMemo(
        () => options.map((item) => ({ value: String(item.id), label: item.name })),
        [options],
    );

    return (
        <Select
            label={label}
            description={description}
            data={selectData}
            value={value}
            onChange={onChange}
            searchable
            clearable={!required}
            required={required}
            disabled={disabled}
            nothingFoundMessage={isLoading ? 'Loading…' : 'No viewable items'}
            size="sm"
        />
    );
}

/**
 * Draws one input per property of a C12 `config_schema`. Resource-backed
 * properties use the viewable plugin-resources list for that type.
 */
export function SchemaConfigForm({
    schema,
    resourceFields,
    value,
    onChange,
    dataVariables,
    disabled = false,
}: ISchemaConfigFormProps) {
    const properties = asPropertyMap(schema);
    const required = requiredKeys(schema);
    const resourceMap = resourceFields ?? {};

    const entries = Object.entries(properties);
    if (entries.length === 0) {
        return null;
    }

    const patch = (key: string, nextValue: unknown) => {
        onChange({ ...value, [key]: nextValue });
    };

    return (
        <Stack gap="sm" data-testid="schema-config-form">
            {entries.map(([key, prop]) => {
                const label = prop.title || key;
                const description = prop.description;
                const isRequired = required.includes(key);
                const resourceType = resourceMap[key];

                if (resourceType) {
                    const raw = value[key];
                    const selected =
                        raw === undefined || raw === null || raw === ''
                            ? null
                            : String(raw);
                    return (
                        <ResourcePicker
                            key={key}
                            typeCode={resourceType}
                            label={label}
                            description={description}
                            value={selected}
                            required={isRequired}
                            disabled={disabled}
                            onChange={(v) => {
                                if (v === null || v === '') {
                                    const next = { ...value };
                                    delete next[key];
                                    onChange(next);
                                    return;
                                }
                                patch(key, Number(v));
                            }}
                        />
                    );
                }

                if (prop.enum && prop.enum.length > 0) {
                    return (
                        <Select
                            key={key}
                            label={label}
                            description={description}
                            data={prop.enum.map((item) => ({
                                value: String(item),
                                label: String(item),
                            }))}
                            value={value[key] === undefined || value[key] === null ? null : String(value[key])}
                            onChange={(v) => {
                                if (v === null) {
                                    const next = { ...value };
                                    delete next[key];
                                    onChange(next);
                                    return;
                                }
                                const match = prop.enum?.find((item) => String(item) === v);
                                patch(key, match !== undefined ? match : v);
                            }}
                            searchable
                            clearable={!isRequired}
                            required={isRequired}
                            disabled={disabled}
                            size="sm"
                        />
                    );
                }

                if (prop.type === 'boolean') {
                    return (
                        <Switch
                            key={key}
                            label={label}
                            description={description}
                            checked={Boolean(value[key])}
                            onChange={(e) => patch(key, e.currentTarget.checked)}
                            disabled={disabled}
                            size="sm"
                        />
                    );
                }

                if (prop.type === 'integer' || prop.type === 'number') {
                    return (
                        <NumberInput
                            key={key}
                            label={label}
                            description={description}
                            value={typeof value[key] === 'number' ? value[key] : value[key] === undefined ? '' : Number(value[key])}
                            onChange={(v) => {
                                if (v === '' || v === undefined || v === null) {
                                    const next = { ...value };
                                    delete next[key];
                                    onChange(next);
                                    return;
                                }
                                patch(key, typeof v === 'number' ? v : Number(v));
                            }}
                            min={prop.minimum}
                            max={prop.maximum}
                            allowDecimal={prop.type === 'number'}
                            required={isRequired}
                            disabled={disabled}
                            size="sm"
                        />
                    );
                }

                if (prop.format === 'variable-text') {
                    return (
                        <TextInputWithMentions
                            key={key}
                            fieldId={0}
                            label={label}
                            description={description}
                            value={typeof value[key] === 'string' ? value[key] : ''}
                            onChange={(v) => patch(key, v)}
                            dataVariables={dataVariables}
                            required={isRequired}
                            disabled={disabled}
                        />
                    );
                }

                return (
                    <TextInput
                        key={key}
                        label={label}
                        description={description}
                        value={typeof value[key] === 'string' ? value[key] : value[key] == null ? '' : String(value[key])}
                        onChange={(e) => patch(key, e.currentTarget.value)}
                        maxLength={prop.maxLength}
                        required={isRequired}
                        disabled={disabled}
                        size="sm"
                    />
                );
            })}
        </Stack>
    );
}
