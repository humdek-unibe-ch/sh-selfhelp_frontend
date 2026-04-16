enum JobStatus {
  QUEUED = 'Queued',
  DONE = 'Done',
  FAILED = 'Failed',
  DELETED = 'Deleted',
}

type JobStatusMeta = {
  label: string;
  color: string;
  legendColor: string;
};

const JOB_STATUS_META: Record<string, JobStatusMeta> = {
  queued: {
    label: JobStatus.QUEUED,
    color: 'blue',
    legendColor: 'var(--mantine-color-blue-6)',
  },
  done: {
    label: JobStatus.DONE,
    color: 'green',
    legendColor: 'var(--mantine-color-green-6)',
  },
  failed: {
    label: JobStatus.FAILED,
    color: 'red',
    legendColor: 'var(--mantine-color-red-6)',
  },
  deleted: {
    label: JobStatus.DELETED,
    color: 'gray',
    legendColor: 'var(--mantine-color-gray-6)',
  },
};

export const STATUS_LEGEND: ReadonlyArray<{ label: string; color: string }> = [
  JOB_STATUS_META.queued,
  JOB_STATUS_META.done,
  JOB_STATUS_META.failed,
  JOB_STATUS_META.deleted,
].map(({ label, legendColor }) => ({
  label,
  color: legendColor,
}));

/**
 * Returns the Mantine color associated with a specific Job Status
 */
export const getJobStatusColor = (status: string | JobStatus): string => {
  const normalizedStatus = status.toLowerCase();
  return JOB_STATUS_META[normalizedStatus]?.color ?? 'gray';
};


/**
 * Determines whether a job allows user actions (execute/delete/etc). Add to the array as needed
 * Only jobs in 'queued' or 'failed' state are considered actionable.
 *
 * @param status - Normalized job status string
 * @returns True if actions are allowed, false otherwise
 */
export function isJobActionAllowed(status: string): boolean {
  return ['queued', 'failed'].includes(status.toLowerCase());
}
