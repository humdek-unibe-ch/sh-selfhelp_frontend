"use client";

import { useAuth } from '../../../../../hooks/useAuth';
import { ROUTES } from '../../../../../config/routes.config';
import { useRouter } from 'next/navigation';
import { useCanViewAuditLogs } from '../../../../../hooks/usePermissionChecks';
import { useEffect, useState } from 'react';
import { AuditLogsList } from '../audit-logs-list/AuditLogsList';
import { AuditLogsStats } from '../audit-logs-stats/AuditLogsStats';
import { AuditLogDetailModal } from '../audit-log-detail-modal/AuditLogDetailModal';
import { Alert, Title, Text, Tabs, Box } from '@mantine/core';
import { IconAlertCircle, IconChartBar, IconList } from '@tabler/icons-react';
import { useQueryState } from 'nuqs';

export function AuditLogsPage() {
  const { isLoading } = useAuth();
  const router = useRouter();
  const hasAuditViewPermission = useCanViewAuditLogs();
  const [detailModalState, setDetailModalState] = useState<{
    opened: boolean;
    auditLogId: number | null;
  }>({
    opened: false,
    auditLogId: null,
  });

  // URL state management for active tab
  const [activeTab, setActiveTab] = useQueryState('tab', {
    defaultValue: 'stats',
    parse: (value: string) => value || 'stats',
    serialize: (value: string) => value,
  });

  useEffect(() => {
    if (!isLoading && !hasAuditViewPermission) {
      router.push(ROUTES.NO_ACCESS);
    }
  }, [hasAuditViewPermission, isLoading, router]);

  // Handle opening detail modal
  const handleViewDetails = (auditLogId: number) => {
    setDetailModalState({
      opened: true,
      auditLogId,
    });
  };

  // Handle closing detail modal
  const handleCloseDetailModal = () => {
    setDetailModalState({
      opened: false,
      auditLogId: null,
    });
  };

  // Show loading state while checking permissions
  if (isLoading) {
    return null;
  }

  // Show access denied if no permission
  if (!hasAuditViewPermission) {
    return (
      <Alert
        variant="light"
        color="red"
        title="Access Denied"
        icon={<IconAlertCircle />}
      >
        You don't have permission to view audit logs. Required permission: admin.audit.view
      </Alert>
    );
  }

  return (
    <Box>
      <div className="mb-6">
        <Title order={2}>Audit Logs</Title>
        <Text c="dimmed" size="sm">
          Monitor data access security and permission checks across the system
        </Text>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="stats" leftSection={<IconChartBar size={16} />}>
            Statistics
          </Tabs.Tab>
          <Tabs.Tab value="logs" leftSection={<IconList size={16} />}>
            Logs
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="stats" pt="md">
          <AuditLogsStats />
        </Tabs.Panel>

        <Tabs.Panel value="logs" pt="md">
          <AuditLogsList onViewDetails={handleViewDetails} />
        </Tabs.Panel>
      </Tabs>

      {/* Detail Modal */}
      <AuditLogDetailModal
        opened={detailModalState.opened}
        onClose={handleCloseDetailModal}
        auditLogId={detailModalState.auditLogId}
      />
    </Box>
  );
}
