"use client";

import { 
    Modal, 
    Title, 
    Text, 
    Group, 
    Badge, 
    Stack, 
    Table, 
    Button, 
    Code,
    Paper,
    LoadingOverlay
} from '@mantine/core';
import { IconPlayerPlay, IconTrash } from '@tabler/icons-react';
import { useScheduledJob, useScheduledJobTransactions } from '../../../../../hooks/useScheduledJobs';

interface IScheduledJobTransaction {
    transaction_id: number;
    transaction_time: string;
    transaction_type: string;
    transaction_verbal_log: string;
    user: string;
}

// Using the imported type instead of local interface

interface IScheduledJobDetailsModalProps {
    opened: boolean;
    onClose: () => void;
    jobId?: number;
    onExecuteJob?: (jobId: number) => void;
    onDeleteJob?: (jobId: number, description: string) => void;
}

export function ScheduledJobDetailsModal({
    opened,
    onClose,
    jobId,
    onExecuteJob,
    onDeleteJob
}: IScheduledJobDetailsModalProps) {
    const { data: jobDetailsData, isLoading: loading } = useScheduledJob(jobId || 0, opened && !!jobId);
    const { data: transactionsData, isLoading: transactionsLoading } = useScheduledJobTransactions(jobId || 0, opened && !!jobId);

    const jobDetails = jobDetailsData?.data;
    const transactions = transactionsData?.data || [];

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'queued': return 'blue';
            case 'done': return 'green';
            case 'failed': return 'red';
            case 'deleted': return 'gray';
            default: return 'gray';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleExecute = () => {
        if (jobId && onExecuteJob) {
            onExecuteJob(jobId);
            onClose();
        }
    };

    const handleDelete = () => {
        if (jobId && onDeleteJob && jobDetails) {
            onDeleteJob(jobId, jobDetails.description);
            onClose();
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Title order={3} component="div">Scheduled Job ID: {jobId}</Title>}
            size="xl"
            centered
        >
            <div style={{ position: 'relative' }}>
                <LoadingOverlay visible={loading} />
                {jobDetails ? (
                <Stack gap="lg">
                    {/* Job Details */}
                    <Paper p="md" withBorder>
                        <Title order={4} mb="md">Job Details</Title>
                        <Stack gap="sm">
                            <Group>
                                <Text size="sm" fw={500}>Status:</Text>
                                <Badge color={getStatusColor(typeof jobDetails.status === 'string' ? jobDetails.status : jobDetails.status.value)}>
                                    {typeof jobDetails.status === 'string' ? jobDetails.status : jobDetails.status.value}
                                </Badge>
                            </Group>
                            <Group>
                                <Text size="sm" fw={500}>Type:</Text>
                                <Text size="sm">{typeof jobDetails.job_type === 'string' ? jobDetails.job_type : jobDetails.job_type?.value}</Text>
                            </Group>
                            <Group>
                                <Text size="sm" fw={500}>Description:</Text>
                                <Text size="sm">{jobDetails.description}</Text>
                            </Group>
                            <Group>
                                <Text size="sm" fw={500}>Date Created:</Text>
                                <Text size="sm">{formatDate(jobDetails.date_create)}</Text>
                            </Group>
                            <Group>
                                <Text size="sm" fw={500}>Date to be Executed:</Text>
                                <Text size="sm">{formatDate(jobDetails.date_to_be_executed)}</Text>
                            </Group>
                            <Group>
                                <Text size="sm" fw={500}>Date Executed:</Text>
                                <Text size="sm">{jobDetails.date_executed ? formatDate(jobDetails.date_executed) : '-'}</Text>
                            </Group>
                        </Stack>
                    </Paper>

                    {/* Configuration */}
                    {jobDetails.config && (
                        <Paper p="md" withBorder>
                            <Title order={4} mb="md">Configuration</Title>
                            <Code block>{JSON.stringify(jobDetails.config, null, 2)}</Code>
                        </Paper>
                    )}

                    {/* Transactions */}
                    <Paper p="md" withBorder>
                        <Title order={4} mb="md">Transactions</Title>
                        {transactionsLoading ? (
                            <Text c="dimmed">Loading transactions...</Text>
                        ) : transactions.length > 0 ? (
                            <Table>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>ID</Table.Th>
                                        <Table.Th>Time</Table.Th>
                                        <Table.Th>Type</Table.Th>
                                        <Table.Th>User</Table.Th>
                                        <Table.Th>Log</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {transactions.map((transaction) => (
                                        <Table.Tr key={transaction.transaction_id}>
                                            <Table.Td>{transaction.transaction_id}</Table.Td>
                                            <Table.Td>{formatDate(transaction.transaction_time)}</Table.Td>
                                            <Table.Td>{transaction.transaction_type}</Table.Td>
                                            <Table.Td>{transaction.user}</Table.Td>
                                            <Table.Td>
                                                <Text size="sm" style={{ maxWidth: 300 }} truncate>
                                                    {transaction.transaction_verbal_log}
                                                </Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Text c="dimmed">No transactions found</Text>
                        )}
                    </Paper>

                    {/* Action Buttons */}
                    <Group justify="flex-end">
                        <Button
                            variant="light"
                            color="gray"
                            leftSection={<IconPlayerPlay size={16} />}
                            onClick={handleExecute}
                            disabled={(typeof jobDetails.status === 'string' ? jobDetails.status : jobDetails.status.value).toLowerCase() !== 'queued'}
                        >
                            Execute Job
                        </Button>
                        <Button
                            variant="light"
                            color="red"
                            leftSection={<IconTrash size={16} />}
                            onClick={handleDelete}
                        >
                            Delete Job
                        </Button>
                    </Group>
                </Stack>
                            ) : (
                    <Text ta="center" p="md" c="red">Failed to load job details</Text>
                )}
            </div>
        </Modal>
    );
} 