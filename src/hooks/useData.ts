import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminDataApi } from '../api/admin/data.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type {
  IDataTablesListResponse,
  IDataRowsResponse,
  IDataTableColumnsResponse,
  IDeleteColumnsRequest,
  IDeleteColumnsResponse,
  IDeleteRecordResponse,
  IDeleteTableResponse,
} from '../types/responses/admin/data.types';

export const DATA_QUERY_KEYS = {
  all: ['admin', 'data'] as const,
  tables: () => [...DATA_QUERY_KEYS.all, 'tables'] as const,
  rows: (tableName: string, userId?: number, excludeDeleted: boolean = true) => [
    ...DATA_QUERY_KEYS.all,
    'rows',
    { tableName, userId: userId ?? -1, excludeDeleted },
  ] as const,
  columns: (tableName: string) => [...DATA_QUERY_KEYS.all, 'columns', tableName] as const,
};

export function useDataTables() {
  return useQuery<IDataTablesListResponse>({
    queryKey: DATA_QUERY_KEYS.tables(),
    queryFn: () => AdminDataApi.listDataTables(),
    staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
  });
}

export function useDataRows(params: { table_name: string; user_id?: number; exclude_deleted?: boolean }) {
  const { table_name, user_id, exclude_deleted } = params;
  return useQuery<IDataRowsResponse>({
    queryKey: DATA_QUERY_KEYS.rows(table_name, user_id, exclude_deleted ?? true),
    queryFn: () => AdminDataApi.getDataRows({ table_name, user_id, exclude_deleted }),
    enabled: !!table_name,
    staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    select: (data) => data, // identity transform
  });
}

export function useTableColumns(tableName?: string) {
  return useQuery<IDataTableColumnsResponse>({
    queryKey: tableName ? DATA_QUERY_KEYS.columns(tableName) : ['noop'],
    queryFn: () => AdminDataApi.getTableColumns(tableName as string),
    enabled: !!tableName,
    staleTime: REACT_QUERY_CONFIG.SPECIAL_CONFIGS.STATIC_DATA.staleTime,
  });
}

export function useDeleteColumns() {
  const queryClient = useQueryClient();
  return useMutation<{ tableName: string; result: IDeleteColumnsResponse }, unknown, { tableName: string; body: IDeleteColumnsRequest }>(
    {
      mutationFn: async ({ tableName, body }) => ({ tableName, result: await AdminDataApi.deleteColumns(tableName, body) }),
      onSuccess: ({ tableName }) => {
        queryClient.invalidateQueries({ queryKey: DATA_QUERY_KEYS.columns(tableName) });
      },
    }
  );
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();
  return useMutation<IDeleteRecordResponse, unknown, { recordId: number; refetchKeys?: any[]; ownEntriesOnly?: boolean }>(
    {
      mutationFn: ({ recordId, ownEntriesOnly }) => AdminDataApi.deleteRecord(recordId, { own_entries_only: ownEntriesOnly }),
      onSuccess: (_, variables) => {
        if (variables.refetchKeys) {
          variables.refetchKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key as any }));
        }
      },
    }
  );
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  return useMutation<IDeleteTableResponse, unknown, { tableName: string }>(
    {
      mutationFn: ({ tableName }) => AdminDataApi.deleteTable(tableName),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: DATA_QUERY_KEYS.tables() });
      },
    }
  );
}


