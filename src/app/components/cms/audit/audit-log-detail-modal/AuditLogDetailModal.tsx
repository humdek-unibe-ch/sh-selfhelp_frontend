"use client";

import {
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  Card,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import { IconAlertCircle, IconUser, IconDatabase, IconClock, IconNetwork, IconBrowser } from '@tabler/icons-react';
import { useAuditLog } from '../../../../../hooks/useAuditLogs';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';

interface AuditLogDetailModalProps {
  opened: boolean;
  onClose: () => void;
  auditLogId: number | null;
}

// Format CRUD permissions bit flags
const formatCrudPermissions = (permissions: number | null): string => {
  if (permissions === null) return 'None';
  const flags = [];
  if (permissions & 1) flags.push('Create (C)');
  if (permissions & 2) flags.push('Read (R)');
  if (permissions & 4) flags.push('Update (U)');
  if (permissions & 8) flags.push('Delete (D)');
  return flags.join(', ') || 'None';
};

// Format timestamp
const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

// Get permission result color
const getPermissionResultColor = (result: string): string => {
  switch (result) {
    case 'granted': return 'green';
    case 'denied': return 'red';
    case 'error': return 'orange';
    default: return 'gray';
  }
};

// Get action color
const getActionColor = (action: string): string => {
  switch (action) {
    case 'create': return 'blue';
    case 'read': return 'green';
    case 'update': return 'orange';
    case 'delete': return 'red';
    default: return 'gray';
  }
};

export function AuditLogDetailModal({ opened, onClose, auditLogId }: AuditLogDetailModalProps) {
  const { data: auditLog, isLoading, error } = useAuditLog(auditLogId || 0);

  const renderDetailSection = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <Card withBorder>
      <Group mb="xs">
        {icon}
        <Text fw={600} size="sm">{title}</Text>
      </Group>
      {children}
    </Card>
  );

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title="Audit Log Details"
      size="lg"
      centered
      onCancel={onClose}
      cancelLabel="Close"
      closeOnClickOutside={true}
      closeOnEscape={true}
      scrollAreaHeight={600}
    >
      {isLoading && <LoadingOverlay visible />}
      {error && (
        <Alert variant="light" color="red" title="Error" icon={<IconAlertCircle />}>
          Failed to load audit log details
        </Alert>
      )}
      {auditLog && (
        <Stack>
          {/* Header Info */}
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={700} size="lg">Log Entry #{auditLog.id}</Text>
              <Text size="sm" c="dimmed">
                {formatTimestamp(auditLog.createdAt)}
              </Text>
            </div>
            <Badge color={getPermissionResultColor(auditLog.permissionResult.lookupCode)} variant="light">
              {auditLog.permissionResult.lookupValue}
            </Badge>
          </Group>

          <Divider />

          {/* User Information */}
          {renderDetailSection(
            'User Information',
            <IconUser size={16} />,
            <Stack gap="xs">
              <Group>
                <Text size="sm" fw={500}>Username:</Text>
                <Text size="sm">{auditLog.user.username}</Text>
              </Group>
              <Group>
                <Text size="sm" fw={500}>Email:</Text>
                <Text size="sm">{auditLog.user.email}</Text>
              </Group>
            </Stack>
          )}

          {/* Action & Resource */}
          {renderDetailSection(
            'Action & Resource',
            <IconDatabase size={16} />,
            <Stack gap="xs">
              <Group>
                <Text size="sm" fw={500}>Action:</Text>
                <Badge color={getActionColor(auditLog.action.lookupCode)} variant="light">
                  {auditLog.action.lookupValue}
                </Badge>
              </Group>
              <Group>
                <Text size="sm" fw={500}>Resource Type:</Text>
                <Badge variant="outline">
                  {auditLog.resourceType.lookupValue}
                </Badge>
              </Group>
              <Group>
                <Text size="sm" fw={500}>Resource ID:</Text>
                <Text size="sm">{auditLog.resourceId}</Text>
              </Group>
              <Group>
                <Text size="sm" fw={500}>CRUD Permissions:</Text>
                <Text size="sm">{formatCrudPermissions(auditLog.crudPermission)}</Text>
              </Group>
            </Stack>
          )}

          {/* Request Details */}
          {renderDetailSection(
            'Request Details',
            <IconNetwork size={16} />,
            <Stack gap="xs">
              <Group>
                <Text size="sm" fw={500}>HTTP Method:</Text>
                <Badge variant="dot">{auditLog.httpMethod}</Badge>
              </Group>
              <Group>
                <Text size="sm" fw={500}>Request URI:</Text>
                <Text size="sm" style={{ wordBreak: 'break-all' }}>
                  {auditLog.requestUri}
                </Text>
              </Group>
              <Group>
                <Text size="sm" fw={500}>IP Address:</Text>
                <Text size="sm">{auditLog.ipAddress}</Text>
              </Group>
              {auditLog.requestBodyHash && (
                <Group>
                  <Text size="sm" fw={500}>Request Body Hash:</Text>
                  <Text size="sm" style={{ fontFamily: 'monospace' }}>
                    {auditLog.requestBodyHash}
                  </Text>
                </Group>
              )}
            </Stack>
          )}

          {/* Browser Information */}
          {auditLog.userAgent && renderDetailSection(
            'Browser Information',
            <IconBrowser size={16} />,
            <Stack gap="xs">
              <Group>
                <Text size="sm" fw={500}>User Agent:</Text>
                <Text size="sm" style={{ wordBreak: 'break-all' }}>
                  {auditLog.userAgent}
                </Text>
              </Group>
            </Stack>
          )}

          {/* Additional Notes */}
          {auditLog.notes && renderDetailSection(
            'Additional Notes',
            <IconClock size={16} />,
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {auditLog.notes}
            </Text>
          )}

          {/* Timestamp */}
          {renderDetailSection(
            'Timestamps',
            <IconClock size={16} />,
            <Group>
              <Text size="sm" fw={500}>Created:</Text>
              <Text size="sm">{formatTimestamp(auditLog.createdAt)}</Text>
            </Group>
          )}
        </Stack>
      )}
    </ModalWrapper>
  );
}
