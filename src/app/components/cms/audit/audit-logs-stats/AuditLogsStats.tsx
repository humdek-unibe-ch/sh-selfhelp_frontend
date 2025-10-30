"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  Group,
  Text,
  Stack,
  RingProgress,
  Progress,
  Badge,
  LoadingOverlay,
  Alert,
  Button,
  Box,
  SimpleGrid,
  Divider,
} from '@mantine/core';
import { IconAlertCircle, IconRefresh, IconDatabase, IconShield, IconShieldCheck, IconTrendingUp, IconFilter, IconX } from '@tabler/icons-react';
import { useAuditStats } from '../../../../../hooks/useAuditLogs';
import { DatePickerInput } from '@mantine/dates';
import type { IAuditStatsParams } from '../../../../../types/responses/admin/audit.types';

export function AuditLogsStats() {
  const [dateRange, setDateRange] = useState<IAuditStatsParams>({
    date_from: undefined,
    date_to: undefined,
  });
  const [localDateRange, setLocalDateRange] = useState<IAuditStatsParams>({
    date_from: undefined,
    date_to: undefined,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: stats, isLoading, error, refetch } = useAuditStats(dateRange);

  // Sync local state with props
  useEffect(() => {
    setLocalDateRange(dateRange);
  }, [dateRange]);

  const handleDateChange = (field: 'date_from' | 'date_to', value: any) => {
    let dateStr: string | undefined;
    if (value) {
      const dateObj = typeof value === 'string' ? new Date(value) : value;
      if (!isNaN(dateObj.getTime())) {
        dateStr = dateObj.toISOString().split('T')[0];
      }
    }

    setLocalDateRange(prev => ({
      ...prev,
      [field]: dateStr,
    }));
  };

  const applyFilters = () => {
    // Remove empty/undefined values and apply to parent state
    const cleanedFilters = Object.fromEntries(
      Object.entries(localDateRange).filter(([, value]) =>
        value !== undefined && value !== null && value !== ''
      )
    );
    setDateRange(cleanedFilters as IAuditStatsParams);
  };

  const clearFilters = () => {
    const emptyFilters = { date_from: undefined, date_to: undefined };
    setLocalDateRange(emptyFilters);
    setDateRange(emptyFilters);
  };

  const hasActiveFilters = Object.entries(localDateRange).some(([key, value]) => {
    return value !== undefined && value !== null && value !== '';
  });

  if (error) {
    return (
      <Alert variant="light" color="red" title="Error" icon={<IconAlertCircle />}>
        Failed to load audit statistics
      </Alert>
    );
  }

  const totalLogs = stats?.totalLogs || 0;
  const deniedAttempts = stats?.deniedAttempts || 0;
  const uniqueResources = stats?.uniqueResources || 0;
  const uniqueUsers = stats?.uniqueUsers || 0;
  const mostAccessedResources = stats?.mostAccessedResources || [];
  const recentDeniedAttempts = stats?.recentDeniedAttempts || [];

  // Calculate success rate (total - denied) / total * 100
  const successRate = totalLogs > 0 ? ((totalLogs - deniedAttempts) / totalLogs) * 100 : 100;
  const deniedRate = totalLogs > 0 ? (deniedAttempts / totalLogs) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={500}>Audit Statistics</Text>
            <Text size="sm" c="dimmed">
              Overview of data access patterns and security events
            </Text>
          </div>
          <Group>
            <Button
              variant="light"
              leftSection={<IconFilter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              Refresh
            </Button>
          </Group>
        </Group>

        {/* Filters */}
        {showFilters && (
          <>
            <Divider />
            <Stack>
              <Group grow>
                <DatePickerInput
                  label="From Date"
                  placeholder="Start date"
                  value={localDateRange.date_from ? new Date(localDateRange.date_from) : null}
                  onChange={(date) => handleDateChange('date_from', date)}
                  clearable
                />
                <DatePickerInput
                  label="To Date"
                  placeholder="End date"
                  value={localDateRange.date_to ? new Date(localDateRange.date_to) : null}
                  onChange={(date) => handleDateChange('date_to', date)}
                  clearable
                />
              </Group>

              {/* Action buttons */}
              <Group justify="space-between">
                <div>
                  {hasActiveFilters && (
                    <Badge variant="light" color="blue">
                      Filters active
                    </Badge>
                  )}
                </div>
                <Group>
                  <Button variant="light" onClick={clearFilters} leftSection={<IconX size={16} />}>
                    Clear Filters
                  </Button>
                  <Button onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </Group>
              </Group>
            </Stack>
          </>
        )}
      </Card>

      {/* Statistics Cards */}
      <div className="relative">
        <LoadingOverlay visible={isLoading} />
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {/* Total Logs */}
          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">Total Logs</Text>
                <Text fw={700} size="xl">{totalLogs.toLocaleString()}</Text>
              </div>
              <IconDatabase size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />
            </Group>
          </Card>

          {/* Success Rate */}
          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">Success Rate</Text>
                <Text fw={700} size="xl" c="green">{successRate.toFixed(1)}%</Text>
              </div>
              <Box>
                <RingProgress
                  size={40}
                  thickness={4}
                  sections={[{ value: successRate, color: 'green' }]}
                />
              </Box>
            </Group>
          </Card>

          {/* Denied Attempts */}
          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">Denied Attempts</Text>
                <Text fw={700} size="xl" c={deniedAttempts > 0 ? 'red' : 'green'}>{deniedAttempts.toLocaleString()}</Text>
                <Text size="xs" c="dimmed">{deniedRate.toFixed(1)}%</Text>
              </div>
              <Box>
                <RingProgress
                  size={40}
                  thickness={4}
                  sections={[{ value: deniedRate, color: deniedAttempts > 0 ? 'red' : 'green' }]}
                />
              </Box>
            </Group>
          </Card>

          {/* Unique Resources */}
          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">Unique Resources</Text>
                <Text fw={700} size="xl">{uniqueResources.toLocaleString()}</Text>
              </div>
              <IconShield size={24} style={{ color: 'var(--mantine-color-purple-6)' }} />
            </Group>
          </Card>
        </SimpleGrid>

        {/* Success vs Denied Chart */}
        <Card withBorder mt="md">
          <Text fw={600} mb="md">Access Success Rate</Text>
          <Stack gap="md">
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm">Successful Access</Text>
                <Text size="sm" fw={500}>{(totalLogs - deniedAttempts).toLocaleString()}</Text>
              </Group>
              <Progress value={successRate} color="green" size="lg" />
            </div>
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm">Denied Access</Text>
                <Text size="sm" fw={500}>{deniedAttempts.toLocaleString()}</Text>
              </Group>
              <Progress value={deniedRate} color="red" size="lg" />
            </div>
          </Stack>
        </Card>

        {/* Most Accessed Resources */}
        {mostAccessedResources.length > 0 && (
          <Card withBorder mt="md">
            <Text fw={600} mb="md">Most Accessed Resources</Text>
            <Stack gap="sm">
              {mostAccessedResources.slice(0, 10).map((resource, index) => (
                <Group key={`${resource.resourceType}-${resource.resourceId}-${index}`} justify="space-between">
                  <Group>
                    <IconDatabase size={16} />
                    <div>
                      <Text size="sm" fw={500}>
                        {resource.resourceType}
                        {resource.resourceId !== 0 && ` #${resource.resourceId}`}
                      </Text>
                    </div>
                  </Group>
                  <Group gap="xs">
                    <Badge color="blue" variant="light">
                      {resource.accessCount} accesses
                    </Badge>
                    {index === 0 && <Badge color="yellow" variant="light">Top</Badge>}
                  </Group>
                </Group>
              ))}
            </Stack>
          </Card>
        )}

        {/* Unique Users */}
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" mt="md">
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>System Overview</Text>
              <IconTrendingUp size={20} />
            </Group>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm">Active Users:</Text>
                <Badge color="blue" variant="light">{uniqueUsers}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Resources Accessed:</Text>
                <Badge color="purple" variant="light">{uniqueResources}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Total Operations:</Text>
                <Badge color="green" variant="light">{totalLogs}</Badge>
              </Group>
            </Stack>
          </Card>

          {/* Security Status */}
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Security Status</Text>
              <IconShieldCheck size={20} />
            </Group>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm">Security Events:</Text>
                <Badge color={deniedAttempts > 0 ? 'orange' : 'green'} variant="light">
                  {deniedAttempts > 0 ? 'Active Monitoring' : 'All Clear'}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Access Control:</Text>
                <Badge color="green" variant="light">Enforced</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Audit Coverage:</Text>
                <Badge color="blue" variant="light">Complete</Badge>
              </Group>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Recent Denied Attempts */}
        {recentDeniedAttempts.length > 0 && (
          <Card withBorder mt="md">
            <Text fw={600} mb="md">Recent Security Events</Text>
            <Stack gap="sm">
              {recentDeniedAttempts.slice(0, 5).map((attempt, index) => (
                <Group key={attempt.id} justify="space-between" align="flex-start">
                  <Group>
                    <IconShield size={16} style={{ color: 'var(--mantine-color-red-6)' }} />
                    <div>
                      <Text size="sm" fw={500}>
                        {attempt.user.username} → {attempt.resourceType.lookupValue}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {attempt.action.lookupValue} • {new Date(attempt.createdAt).toLocaleString()}
                      </Text>
                    </div>
                  </Group>
                  <Badge color="red" variant="light">Denied</Badge>
                </Group>
              ))}
            </Stack>
          </Card>
        )}
      </div>
    </div>
  );
}
