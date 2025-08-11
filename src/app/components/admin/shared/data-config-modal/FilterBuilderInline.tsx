"use client";

import { useEffect, useMemo, useState } from 'react';
import { Stack, Text, Code, Divider, Group, Select as MantineSelect, NumberInput, ActionIcon, Button } from '@mantine/core';
import { QueryBuilder, RuleGroupType, defaultValidator, formatQuery } from 'react-querybuilder';
import { mantineControlElements } from '@react-querybuilder/mantine';
import { useTableColumnNames } from '../../../../../hooks/useData';

interface IProps {
  tableName?: string;
  initialValue?: string; // JSON config saved in filter_config
  onSave: (payload: { sql: string; config: string }) => void;
}

interface IFilterConfig {
  mode?: 'builder' | 'sql';
  sql?: string;
  rules?: RuleGroupType;
  orderBy?: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
  limit?: number;
}

const initialQuery: RuleGroupType = { combinator: 'and', rules: [] };

export function FilterBuilderInline({ tableName, initialValue, onSave }: IProps) {
  const { data: columnNames } = useTableColumnNames(tableName);
  const fields = useMemo(() => {
    const unique = Array.from(new Set(columnNames || []));
    return unique.map((name) => ({ name, label: name, dataType: 'text' as const }));
  }, [columnNames]);

  const [query, setQuery] = useState<RuleGroupType>(initialQuery);
  const [orderBy, setOrderBy] = useState<Array<{ field: string; direction: 'ASC' | 'DESC' }>>([]);
  const [limit, setLimit] = useState<number | undefined>(undefined);

  // Initialize from initialValue only once to avoid feedback loops with parent state
  useEffect(() => {
    const raw = (initialValue || '').trim();
    if (!raw) {
      setQuery(initialQuery);
      setOrderBy([]);
      setLimit(undefined);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as IFilterConfig;
      if (parsed.rules) setQuery(parsed.rules);
      if (Array.isArray(parsed.orderBy)) setOrderBy(parsed.orderBy.filter((o) => o.field));
      if (typeof parsed.limit === 'number') setLimit(parsed.limit);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addOrderBy = () => setOrderBy((prev) => [...prev, { field: '', direction: 'ASC' }]);
  const removeOrderBy = (idx: number) => setOrderBy((prev) => prev.filter((_, i) => i !== idx));
  const updateOrderByField = (idx: number, field: string | null) => setOrderBy((prev) => prev.map((o, i) => i === idx ? { ...o, field: field || '' } : o));
  const updateOrderByDir = (idx: number, dir: 'ASC' | 'DESC') => setOrderBy((prev) => prev.map((o, i) => i === idx ? { ...o, direction: dir } : o));

  const handleSave = () => {
    // Build WHERE, and provide a user-friendly combined SQL for display
    let whereSql = '';
    try {
      whereSql = formatQuery(query, 'sql');
    } catch {
      whereSql = '';
    }

    const orderSql = orderBy.length > 0 ? ` ORDER BY ${orderBy.map((o) => `${o.field} ${o.direction}`).join(', ')}` : '';
    const limitSql = typeof limit === 'number' && limit > 0 ? ` LIMIT ${limit}` : '';
    const combinedSql = `${whereSql}${orderSql}${limitSql}`.trim();

    const config: IFilterConfig = {
      mode: 'builder',
      sql: whereSql,
      rules: query,
      orderBy: orderBy.filter((o) => o.field),
      limit,
    };

    onSave({ sql: combinedSql, config: JSON.stringify(config) });
  };

  // Auto-apply on any change
  useEffect(() => {
    handleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, orderBy, limit]);

  return (
    <Stack gap="sm">
      <QueryBuilder
        fields={fields}
        query={query}
        onQueryChange={setQuery}
        validator={defaultValidator}
        controlElements={mantineControlElements}
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


