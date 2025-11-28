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
    LoadingOverlay,
    Card,
    Divider,
    ScrollArea,
    JsonInput,
    Tabs,
    List,
    ThemeIcon,
    Accordion
} from '@mantine/core';
import { IconPlayerPlay, IconTrash, IconMail, IconSettings, IconBell, IconCalendar, IconUser, IconClock } from '@tabler/icons-react';
import { useScheduledJob, useScheduledJobTransactions } from '../../../../../hooks/useScheduledJobs';

interface IScheduledJobTransaction {
    transaction_id: number;
    transaction_time: string;
    transaction_type: string;
    transaction_verbal_log: string;
    user: string;
}

// Job type configurations for structured display
const JOB_TYPE_CONFIGS = {
    'email': {
        displayName: 'Email Job',
        icon: IconMail,
        color: 'blue'
    },
    'task': {
        displayName: 'Task Job',
        icon: IconSettings,
        color: 'green'
    },
    'notification': {
        displayName: 'Notification Job',
        icon: IconBell,
        color: 'orange'
    }
} as const;

// Utility function to format transaction log
function formatTransactionLog(log: string): { type: 'text' | 'json', content: any } {
    try {
        const parsed = JSON.parse(log);
        return { type: 'json', content: parsed };
    } catch {
        return { type: 'text', content: log };
    }
}

// Component to render email job configuration
function EmailJobConfig({ config }: { config: any }) {
    const emailConfig = config.email || {};

    return (
        <Stack gap="md">
            <Group>
                <Text size="sm" fw={500}>From:</Text>
                <Text size="sm">{emailConfig.from_name} &lt;{emailConfig.from_email}&gt;</Text>
            </Group>

            <Group>
                <Text size="sm" fw={500}>Reply To:</Text>
                <Text size="sm">{emailConfig.reply_to}</Text>
            </Group>

            <Group>
                <Text size="sm" fw={500}>Subject:</Text>
                <Text size="sm">{emailConfig.subject}</Text>
            </Group>

            <Group>
                <Text size="sm" fw={500}>Content Type:</Text>
                <Badge color={emailConfig.is_html ? 'blue' : 'gray'}>
                    {emailConfig.is_html ? 'HTML' : 'Plain Text'}
                </Badge>
            </Group>

            {emailConfig.recipient_emails && (
                <Group>
                    <Text size="sm" fw={500}>Recipients:</Text>
                    <Text size="sm">{emailConfig.recipient_emails}</Text>
                </Group>
            )}

            {emailConfig.cc_emails && (
                <Group>
                    <Text size="sm" fw={500}>CC:</Text>
                    <Text size="sm">{emailConfig.cc_emails}</Text>
                </Group>
            )}

            {emailConfig.bcc_emails && (
                <Group>
                    <Text size="sm" fw={500}>BCC:</Text>
                    <Text size="sm">{emailConfig.bcc_emails}</Text>
                </Group>
            )}

            <Divider />

            <Text size="sm" fw={500}>Email Body:</Text>
            {emailConfig.is_html ? (
                <Paper p="sm" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                    <div dangerouslySetInnerHTML={{ __html: emailConfig.body }} />
                </Paper>
            ) : (
                <Paper p="sm" withBorder>
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{emailConfig.body}</Text>
                </Paper>
            )}

            {emailConfig.attachments && emailConfig.attachments.length > 0 && (
                <>
                    <Divider />
                    <Text size="sm" fw={500}>Attachments:</Text>
                    <List size="sm">
                        {emailConfig.attachments.map((attachment: any, index: number) => (
                            <List.Item key={index}>
                                {attachment.filename || attachment.path}
                            </List.Item>
                        ))}
                    </List>
                </>
            )}
        </Stack>
    );
}

// Component to render task job configuration
function TaskJobConfig({ config }: { config: any }) {
    const taskConfig = config.task || {};

    return (
        <Stack gap="md">
            <Group>
                <Text size="sm" fw={500}>Task Type:</Text>
                <Badge color="green">{taskConfig.task_type}</Badge>
            </Group>

            <Group>
                <Text size="sm" fw={500}>Groups:</Text>
                <Text size="sm">{Array.isArray(taskConfig.groups) ? taskConfig.groups.join(', ') : taskConfig.groups}</Text>
            </Group>

            {taskConfig.reason && (
                <Group>
                    <Text size="sm" fw={500}>Reason:</Text>
                    <Text size="sm">{taskConfig.reason}</Text>
                </Group>
            )}

            {taskConfig.notify_user !== undefined && (
                <Group>
                    <Text size="sm" fw={500}>Notify User:</Text>
                    <Badge color={taskConfig.notify_user ? 'green' : 'red'}>
                        {taskConfig.notify_user ? 'Yes' : 'No'}
                    </Badge>
                </Group>
            )}

            {taskConfig.notify_user && taskConfig.notification_config && (
                <>
                    <Divider />
                    <Text size="sm" fw={500}>Notification Settings:</Text>
                    <Group>
                        <Text size="sm">Type:</Text>
                        <Badge>{taskConfig.notification_config.type || 'email'}</Badge>
                    </Group>
                    {taskConfig.notification_config.subject && (
                        <Group>
                            <Text size="sm">Subject:</Text>
                            <Text size="sm">{taskConfig.notification_config.subject}</Text>
                        </Group>
                    )}
                </>
            )}

            {taskConfig.rollback_config && (
                <>
                    <Divider />
                    <Text size="sm" fw={500}>Rollback Configuration:</Text>
                    <Group>
                        <Text size="sm">Enabled:</Text>
                        <Badge color={taskConfig.rollback_config.enabled ? 'green' : 'red'}>
                            {taskConfig.rollback_config.enabled ? 'Yes' : 'No'}
                        </Badge>
                    </Group>
                    {taskConfig.rollback_config.enabled && (
                        <>
                            <Group>
                                <Text size="sm">Rollback After:</Text>
                                <Text size="sm">{taskConfig.rollback_config.rollback_after} minutes</Text>
                            </Group>
                            <Group>
                                <Text size="sm">Max Attempts:</Text>
                                <Text size="sm">{taskConfig.rollback_config.max_attempts}</Text>
                            </Group>
                        </>
                    )}
                </>
            )}
        </Stack>
    );
}

// Component to render notification job configuration
function NotificationJobConfig({ config }: { config: any }) {
    return (
        <Stack gap="md">
            <Text c="dimmed" ta="center" py="md">
                Notification job configuration is not yet implemented
            </Text>
            <Code block>{JSON.stringify(config, null, 2)}</Code>
        </Stack>
    );
}

// Main configuration renderer
function JobConfiguration({ jobType, config }: { jobType: string, config: any }) {
    const jobTypeKey = jobType.toLowerCase() as keyof typeof JOB_TYPE_CONFIGS;
    const jobConfig = JOB_TYPE_CONFIGS[jobTypeKey];

    if (!jobConfig) {
        return <Code block>{JSON.stringify(config, null, 2)}</Code>;
    }

    const IconComponent = jobConfig.icon;

    return (
        <Stack gap="md">
            <Group>
                <ThemeIcon color={jobConfig.color} size="md">
                    <IconComponent size={16} />
                </ThemeIcon>
                <Text fw={500}>{jobConfig.displayName} Configuration</Text>
            </Group>

            {jobTypeKey === 'email' && <EmailJobConfig config={config} />}
            {jobTypeKey === 'task' && <TaskJobConfig config={config} />}
            {jobTypeKey === 'notification' && <NotificationJobConfig config={config} />}
        </Stack>
    );
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
                        <Group mb="md">
                            {(() => {
                                const jobType = typeof jobDetails.job_type === 'string' ? jobDetails.job_type : jobDetails.job_type?.value;
                                const jobTypeKey = jobType?.toLowerCase() as keyof typeof JOB_TYPE_CONFIGS;
                                const jobConfig = JOB_TYPE_CONFIGS[jobTypeKey];
                                const IconComponent = jobConfig?.icon || IconSettings;

                                return (
                                    <>
                                        <ThemeIcon color={jobConfig?.color || 'gray'} size="lg">
                                            <IconComponent size={20} />
                                        </ThemeIcon>
                                        <div>
                                            <Title order={4}>{jobConfig?.displayName || 'Scheduled Job'}</Title>
                                            <Text size="sm" c="dimmed">ID: {jobDetails.id}</Text>
                                        </div>
                                    </>
                                );
                            })()}
                        </Group>

                        <Stack gap="sm">
                            <Group>
                                <IconCalendar size={16} />
                                <Text size="sm" fw={500}>Status:</Text>
                                <Badge color={getStatusColor(typeof jobDetails.status === 'string' ? jobDetails.status : jobDetails.status.value)}>
                                    {typeof jobDetails.status === 'string' ? jobDetails.status : jobDetails.status.value}
                                </Badge>
                            </Group>

                            <Group>
                                <IconSettings size={16} />
                                <Text size="sm" fw={500}>Type:</Text>
                                <Text size="sm">{typeof jobDetails.job_type === 'string' ? jobDetails.job_type : jobDetails.job_type?.value}</Text>
                            </Group>

                            <Group>
                                <Text size="sm" fw={500}>Description:</Text>
                                <Text size="sm">{jobDetails.description}</Text>
                            </Group>

                            <Divider />

                            <Group>
                                <IconClock size={16} />
                                <Text size="sm" fw={500}>Date Created:</Text>
                                <Text size="sm">{formatDate(jobDetails.date_create)}</Text>
                            </Group>

                            <Group>
                                <IconClock size={16} />
                                <Text size="sm" fw={500}>Date to be Executed:</Text>
                                <Text size="sm">{formatDate(jobDetails.date_to_be_executed)}</Text>
                            </Group>

                            <Group>
                                <IconClock size={16} />
                                <Text size="sm" fw={500}>Date Executed:</Text>
                                <Text size="sm">{jobDetails.date_executed ? formatDate(jobDetails.date_executed) : '-'}</Text>
                            </Group>
                        </Stack>
                    </Paper>

                    {/* Configuration */}
                    {jobDetails.config && (
                        <Paper p="md" withBorder>
                            <Title order={4} mb="md">Configuration</Title>
                            <JobConfiguration
                                jobType={typeof jobDetails.job_type === 'string' ? jobDetails.job_type : jobDetails.job_type?.value}
                                config={jobDetails.config}
                            />
                        </Paper>
                    )}

                    {/* Transactions */}
                    <Paper p="md" withBorder>
                        <Title order={4} mb="md">Transactions</Title>
                        {transactionsLoading ? (
                            <Text c="dimmed">Loading transactions...</Text>
                        ) : transactions.length > 0 ? (
                            <ScrollArea h={400}>
                                <Accordion variant="separated">
                                    {transactions.map((transaction) => {
                                        const logData = formatTransactionLog(transaction.transaction_verbal_log);
                                        return (
                                            <Accordion.Item key={transaction.transaction_id} value={transaction.transaction_id.toString()}>
                                                <Accordion.Control>
                                                    <Group justify="space-between" w="100%">
                                                        <Group gap="xs">
                                                            <Text size="sm" fw={500}>#{transaction.transaction_id}</Text>
                                                            <Badge size="sm" variant="light">{transaction.transaction_type}</Badge>
                                                        </Group>
                                                        <Group gap="xs">
                                                            <IconUser size={14} />
                                                            <Text size="sm" c="dimmed">{transaction.user || 'System'}</Text>
                                                            <IconClock size={14} />
                                                            <Text size="sm" c="dimmed">{formatDate(transaction.transaction_time)}</Text>
                                                        </Group>
                                                    </Group>
                                                </Accordion.Control>
                                                <Accordion.Panel>
                                                    {logData.type === 'json' ? (
                                                        <Stack gap="sm">
                                                            {logData.content.verbal_log && (
                                                                <Group>
                                                                    <Text size="sm" fw={500}>Message:</Text>
                                                                    <Text size="sm">{logData.content.verbal_log}</Text>
                                                                </Group>
                                                            )}
                                                            {logData.content.url && (
                                                                <Group>
                                                                    <Text size="sm" fw={500}>URL:</Text>
                                                                    <Text size="sm" style={{ wordBreak: 'break-all' }}>{logData.content.url}</Text>
                                                                </Group>
                                                            )}
                                                            {logData.content.table_row_entry && (
                                                                <Card withBorder p="sm">
                                                                    <Text size="sm" fw={500} mb="xs">Table Row Entry:</Text>
                                                                    <JsonInput
                                                                        value={JSON.stringify(logData.content.table_row_entry, null, 2)}
                                                                        readOnly
                                                                        size="xs"
                                                                        minRows={3}
                                                                        maxRows={10}
                                                                    />
                                                                </Card>
                                                            )}
                                                            {(logData.content.session || logData.content.session === '') && (
                                                                <Group>
                                                                    <Text size="sm" fw={500}>Session:</Text>
                                                                    <Text size="sm" c="dimmed">{logData.content.session || 'None'}</Text>
                                                                </Group>
                                                            )}
                                                        </Stack>
                                                    ) : (
                                                        <Text style={{ whiteSpace: 'pre-wrap' }}>{logData.content}</Text>
                                                    )}
                                                </Accordion.Panel>
                                            </Accordion.Item>
                                        );
                                    })}
                                </Accordion>
                            </ScrollArea>
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