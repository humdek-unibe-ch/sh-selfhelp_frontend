"use client";

import { useEffect, useMemo, useState } from 'react';
import { Stack, Text, Divider, Group, Select as MantineSelect, NumberInput, ActionIcon, Button } from '@mantine/core';
import { QueryBuilder, RuleGroupType, defaultValidator, formatQuery } from 'react-querybuilder';
import { mantineControlElements } from '@react-querybuilder/mantine';
import { useTableColumnNames } from '../../../../../hooks/useData';
import { parseSQL } from 'react-querybuilder/parseSQL';

interface IProps {
  tableName?: string;
  initialSql?: string; // combined SQL possibly including ORDER BY / LIMIT
  onSave: (payload: { sql: string }) => void;
}

const initialQuery: RuleGroupType = { combinator: 'and', rules: [] };

export function FilterBuilderInline({ tableName, initialSql, onSave }: IProps) {
  const { data: columnNames } = useTableColumnNames(tableName);
  const fields = useMemo(() => {
    const unique = Array.from(new Set(columnNames || []));
    return unique.map((name) => ({ name, label: name, dataType: 'text' as const }));
  }, [columnNames]);

  const [query, setQuery] = useState<RuleGroupType>(initialQuery);
  const [orderBy, setOrderBy] = useState<Array<{ field: string; direction: 'ASC' | 'DESC' }>>([]);
  const [limit, setLimit] = useState<number | undefined>(undefined);

  // Helpers to split combined SQL into where/order/limit
  function splitCombinedSql(sqlCombined: string | undefined) {
    const result = {
      whereSql: '',
      orderBy: [] as Array<{ field: string; direction: 'ASC' | 'DESC' }>,
      limit: undefined as number | undefined,
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
    result.whereSql = where;
    return result;
  }

  // Initialize from initialSql only once to avoid feedback loops with parent state
  useEffect(() => {
    setQuery(parseSQL(initialSql??'1=1'));
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

    onSave({ sql: combinedSql });
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


