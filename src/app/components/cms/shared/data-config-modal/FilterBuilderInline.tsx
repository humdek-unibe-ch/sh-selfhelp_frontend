/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stack, Text, Divider, Group, Select as MantineSelect, NumberInput, ActionIcon, Button } from '@mantine/core';
import { QueryBuilder, type RuleGroupType, type RuleType, type ValueEditorProps, defaultValidator, formatQuery } from 'react-querybuilder';
import { mantineControlElements } from '@react-querybuilder/mantine';
import { useTableColumns } from '../../../../../hooks/useData';
import { parseSQL } from 'react-querybuilder/parseSQL';
import { TextInputWithMentions } from '../field-components/TextInputWithMentions';
import { QUERY_BUILDER_CONTROL_CLASSNAMES } from '../../../../../constants/querybuilder.constants';

interface IProps {
  tableName?: string;
  initialSql?: string; // combined SQL possibly including ORDER BY / LIMIT
  onSave: (payload: { sql: string }) => void;
  dataVariables?: Record<string, string>;
}

const initialQuery: RuleGroupType = { combinator: 'and', rules: [] };

const TIME_TOKENS = ['LAST_HOUR', 'LAST_DAY', 'LAST_WEEK', 'LAST_MONTH', 'LAST_YEAR'] as const;
type TTimeToken = typeof TIME_TOKENS[number];

// Helpers to split combined SQL into where/order/limit and extract time token.
// Pure (no component scope), so they live at module level.
function splitCombinedSql(sqlCombined: string | undefined) {
  const result = {
    whereSql: '',
    orderBy: [] as Array<{ field: string; direction: 'ASC' | 'DESC' }>,
    limit: undefined as number | undefined,
    timeToken: '' as TTimeToken | '',
  };
  if (!sqlCombined) return result;
  const input = sqlCombined.trim();
  const limitMatch = input.match(/\blimit\s+(\d+)\s*$/i);
  if (limitMatch) {
    result.limit = Number(limitMatch[1]);
  }
  const orderMatch = input.match(/\border\s+by\s+(.+?)(?:\s+limit\s+\d+)?\s*$/i);
  if (orderMatch) {
    const parts = orderMatch[1].split(',').map((p) => p.trim()).filter(Boolean);
    result.orderBy = parts.map((p) => {
      const [field, dir] = p.split(/\s+/);
      const direction = (dir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC';
      return { field, direction };
    }).filter((o) => o.field);
  }
  let where = input.replace(/\border\s+by\s+.+?(?:\s+limit\s+\d+)?\s*$/i, '').trim();
  where = where.replace(/\blimit\s+\d+\s*$/i, '').trim();
  // Strip wrapping (1 = 1) placeholder if present
  if (/^\(?\s*1\s*=\s*1\s*\)?$/i.test(where)) {
    where = '';
  }
  // Remove leading AND if present (stored filter requires leading AND, but parser does not)
  where = where.replace(/^\s*AND\s+/i, '');
  // Extract time token if present at the beginning
  for (const token of TIME_TOKENS) {
    const tokenExpr = `\'${token}\'\s*=\s*\'${token}\'`;
    const tokenRegex = new RegExp(`^\s*${tokenExpr}(?:\s+AND\s+)?`, 'i');
    if (tokenRegex.test(where)) {
      result.timeToken = token;
      where = where.replace(tokenRegex, '').trim();
      break;
    }
  }
  result.whereSql = where;
  return result;
}

// Ensure stable IDs on initial query to prevent input remount/focus loss
function ensureIds(node: RuleGroupType | RuleType): RuleGroupType | RuleType {
  const withId = { ...node };
  if (!withId.id) {
    withId.id = `q_${Math.random().toString(36).slice(2, 10)}`;
  }
  if ('rules' in withId && Array.isArray(withId.rules)) {
    withId.rules = withId.rules.map((child) => ensureIds(child)) as RuleGroupType['rules'];
  }
  return withId;
}


export function FilterBuilderInline(props: IProps & { dataVariables?: Record<string, string> }) {
  const { tableName, initialSql, onSave, dataVariables } = props;
  const { data: columnsResp } = useTableColumns(tableName);
  const fields = useMemo(() => {
    // Field identifier is the immutable field_key (it goes into the WHERE SQL,
    // which the backend pivots by field_key); the label shows the display_name.
    const seen = new Set<string>();
    const out: { name: string; label: string; dataType: 'text' }[] = [];
    for (const col of columnsResp?.columns ?? []) {
      if (!col.fieldKey || seen.has(col.fieldKey)) {
        continue;
      }
      seen.add(col.fieldKey);
      out.push({
        name: col.fieldKey,
        label: col.displayName && col.displayName !== '' ? col.displayName : col.fieldKey,
        dataType: 'text' as const,
      });
    }
    return out;
  }, [columnsResp?.columns]);

  // Parse the combined initial SQL once for the lazy state initializers below
  // (replaces the previous one-time init effect; `splitCombinedSql` is pure).
  const initialParsed = splitCombinedSql(initialSql);
  const [query, setQuery] = useState<RuleGroupType>(() => {
    try {
      if (initialParsed.whereSql) {
        const qb = parseSQL(initialParsed.whereSql) as RuleGroupType;
        return qb ? (ensureIds(qb) as RuleGroupType) : initialQuery;
      }
      return initialQuery;
    } catch {
      return initialQuery;
    }
  });
  const [orderBy, setOrderBy] = useState<Array<{ field: string; direction: 'ASC' | 'DESC' }>>(initialParsed.orderBy);
  const [limit, setLimit] = useState<number | undefined>(initialParsed.limit);
  const [timeToken, setTimeToken] = useState<TTimeToken | ''>(initialParsed.timeToken);

  // Custom value editor that supports mentions for text inputs
  const ValueEditorWithMentions = React.useMemo(() => {
    function ValueEditor(props: ValueEditorProps) {
      const { value, handleOnChange, fieldData, type } = props;

      // For text inputs - be more inclusive
      const isTextInput = type === 'text' || fieldData?.dataType === 'text';

      // Show mentions for text fields with any operator (not just string operators)
      if (isTextInput) {
        // Create a stable numeric ID based on field name to prevent re-mounting
        const stableId = fieldData?.name ? fieldData.name.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) : 999;
        return (
          <div style={{ width: '250px' }}>
          <TextInputWithMentions
              fieldId={stableId}
              value={value || ''}
              onChange={handleOnChange || ((_val: string) => {})}
              placeholder="Enter value or use {{variable}}"
              dataVariables={dataVariables}
            />
          </div>
        );
      }

      // Fall back to default Mantine value editor for other types
      const ValueEditorComponent = mantineControlElements.valueEditor as React.ComponentType<ValueEditorProps>;
      return <ValueEditorComponent {...props} />;
    }
    return ValueEditor;
  }, [dataVariables]);

  // Custom control elements with mentions support
  const customControlElements = React.useMemo(() => ({
    ...mantineControlElements,
    valueEditor: ValueEditorWithMentions,
  }), [ValueEditorWithMentions]);

  // Initialization from `initialSql` now happens once via the lazy state
  // initializers above (and the `lastSubmittedSqlRef` seed), replacing the
  // previous mount effect that set state synchronously.

  const addOrderBy = () => setOrderBy((prev) => [...prev, { field: '', direction: 'ASC' }]);
  const removeOrderBy = (idx: number) => setOrderBy((prev) => prev.filter((_, i) => i !== idx));
  const updateOrderByField = (idx: number, field: string | null) => setOrderBy((prev) => prev.map((o, i) => i === idx ? { ...o, field: field || '' } : o));
  const updateOrderByDir = (idx: number, dir: 'ASC' | 'DESC') => setOrderBy((prev) => prev.map((o, i) => i === idx ? { ...o, direction: dir } : o));

  const buildCombinedSql = (): string => {
    // Build WHERE parts
    let formatted = '';
    try {
      formatted = formatQuery(query, 'sql');
    } catch {
      formatted = '';
    }
    const whereParts: string[] = [];
    if (timeToken) {
      whereParts.push(`'${timeToken}' = '${timeToken}'`);
    }
    if (formatted && formatted !== '()') {
      whereParts.push(formatted);
    }
    const whereSql = whereParts.length > 0 ? ` AND ${whereParts.join(' AND ')}` : '';

    const orderSql = orderBy.length > 0 ? ` ORDER BY ${orderBy.map((o) => `${o.field} ${o.direction}`).join(', ')}` : '';
    const limitSql = typeof limit === 'number' && limit > 0 ? ` LIMIT ${limit}` : '';
    return `${whereSql}${orderSql}${limitSql}`.trim();
  };

  const lastSubmittedSqlRef = useRef<string>((initialSql || '').trim());
  const debounceRef = useRef<number | null>(null);

  // Auto-apply with debounce on any builder change (no blur needed)
  useEffect(() => {
    const handler = () => {
      const combinedSql = buildCombinedSql();
      if (combinedSql !== lastSubmittedSqlRef.current) {
        lastSubmittedSqlRef.current = combinedSql;
        onSave({ sql: combinedSql });
      }
    };
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(handler, 500);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, orderBy, limit, timeToken]);

  return (
    <Stack gap="sm">
      <MantineSelect
        label="Time range"
        placeholder="None"
        data={[{ value: '', label: 'None' }, ...TIME_TOKENS.map((t) => ({ value: t, label: t.replace('LAST_', 'Last ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) }))]}
        value={timeToken}
        onChange={(v) => setTimeToken((v as TTimeToken) || '')}
        clearable
      />
      <Text size="sm" fw={500}>Where clause</Text>
      <QueryBuilder      
        fields={fields}
        query={query}
        onQueryChange={setQuery}
        validator={defaultValidator}
        controlElements={customControlElements}
        controlClassnames={QUERY_BUILDER_CONTROL_CLASSNAMES}
      />

      <Divider my="xs" />
      <Text size="sm" fw={500}>Ordering</Text>
      {orderBy.map((o, idx) => (
        <Stack key={idx} gap="xs">
          <MantineSelect
            label="Field"
            placeholder="Select field"
            data={(fields || []).map((f) => ({ value: f.name, label: f.label }))}
            value={o.field || null}
            onChange={(v) => updateOrderByField(idx, v)}
            searchable
            clearable
          />
          <Group align="end" gap="sm">
            <div style={{ flex: 1 }}>
              <MantineSelect
                label="Direction"
                data={[{ value: 'ASC', label: 'ASC' }, { value: 'DESC', label: 'DESC' }]}
                value={o.direction}
                onChange={(v) => updateOrderByDir(idx, (v as 'ASC' | 'DESC') || 'ASC')}
              />
            </div>
            <ActionIcon color="red" variant="subtle" mt={22} onClick={() => removeOrderBy(idx)}>✕</ActionIcon>
          </Group>
        </Stack>
      ))}
      <Button variant="light" onClick={addOrderBy} size="xs">Add order by</Button>

      <NumberInput
        label="Limit"
        placeholder="e.g. 100"
        value={limit}
        onChange={(val) => setLimit(typeof val === 'number' ? val : undefined)}
        allowNegative={false}
        min={1}
      />

      {/* Auto-applied on change; no explicit apply button or preview */}
    </Stack>
  );
}


