"use client";

import { useEffect, useMemo, useState } from 'react';
import { Stack, Text, Code, Divider, Button, Group, Select as MantineSelect, NumberInput, ActionIcon } from '@mantine/core';
import { QueryBuilder, RuleGroupType, defaultValidator, formatQuery } from 'react-querybuilder';
import { QueryBuilderMantine } from '@react-querybuilder/mantine';
import { IconAlertTriangle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
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
  }, [initialValue]);

  const addOrderBy = () => setOrderBy((prev) => [...prev, { field: '', direction: 'ASC' }]);
  const removeOrderBy = (idx: number) => setOrderBy((prev) => prev.filter((_, i) => i !== idx));
  const updateOrderByField = (idx: number, field: string | null) => setOrderBy((prev) => prev.map((o, i) => i === idx ? { ...o, field: field || '' } : o));
  const updateOrderByDir = (idx: number, dir: 'ASC' | 'DESC') => setOrderBy((prev) => prev.map((o, i) => i === idx ? { ...o, direction: dir } : o));

  const handleSave = () => {
    let sql = '';
    try {
      sql = formatQuery(query, 'sql');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to convert rules to SQL',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
      return;
    }
    const orderSql = orderBy.length > 0 ? ` ORDER BY ${orderBy.map((o) => `${o.field} ${o.direction}`).join(', ')}` : '';
    const limitSql = typeof limit === 'number' && limit > 0 ? ` LIMIT ${limit}` : '';
    const combinedSql = `${sql}${orderSql}${limitSql}`.trim();

    const config: IFilterConfig = {
      mode: 'builder',
      sql,
      rules: query,
      orderBy: orderBy.filter((o) => o.field),
      limit,
    };

    onSave({ sql: combinedSql, config: JSON.stringify(config) });
  };

  return (
    <Stack gap="sm">
      <QueryBuilderMantine>
        <QueryBuilder
          fields={fields}
          query={query}
          onQueryChange={setQuery}
          validator={defaultValidator}
        />
      </QueryBuilderMantine>

      <Divider my="xs" />
      <Text size="sm" fw={500}>Ordering</Text>
      {orderBy.map((o, idx) => (
        <Group key={idx} gap="sm" align="end">
          <div style={{ flex: 1 }}>
            <MantineSelect
              label="Field"
              placeholder="Select field"
              data={(fields || []).map((f) => ({ value: f.name, label: f.label }))}
              value={o.field || null}
              onChange={(v) => updateOrderByField(idx, v)}
              searchable
              clearable
            />
          </div>
          <MantineSelect
            label="Direction"
            data={[{ value: 'ASC', label: 'ASC' }, { value: 'DESC', label: 'DESC' }]}
            value={o.direction}
            onChange={(v) => updateOrderByDir(idx, (v as 'ASC' | 'DESC') || 'ASC')}
          />
          <ActionIcon color="red" variant="subtle" mt={22} onClick={() => removeOrderBy(idx)}>✕</ActionIcon>
        </Group>
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

      <Divider my="xs" />
      <Text size="sm" fw={500}>Preview</Text>
      <Code block p="sm" style={{ fontSize: '0.8rem' }}>
        {(() => {
          try {
            const base = formatQuery(query, 'sql');
            const orderSql = orderBy.length > 0 ? ` ORDER BY ${orderBy.map((o) => `${o.field} ${o.direction}`).join(', ')}` : '';
            const limitSql = typeof limit === 'number' && limit > 0 ? ` LIMIT ${limit}` : '';
            return `${base}${orderSql}${limitSql}`.trim();
          } catch {
            return 'Invalid query structure';
          }
        })()}
      </Code>

      <Group justify="flex-end">
        <Button onClick={handleSave}>Apply Filter</Button>
      </Group>
    </Stack>
  );
}


