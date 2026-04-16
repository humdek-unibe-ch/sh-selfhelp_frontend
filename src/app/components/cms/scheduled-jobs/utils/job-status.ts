import { IScheduledJobDetailData } from "../../../../../types/responses/admin/scheduled-jobs.types";

export enum JobStatus {
  QUEUED = 'Queued',
  DONE = 'Done',
  FAILED = 'Failed',
  DELETED = 'Deleted',
}

/**
 * Returns the Mantine color associated with a specific Job Status
 */
export const getJobStatusColor = (status: string | JobStatus): string => {
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case JobStatus.QUEUED.toLowerCase():
      return 'blue';
    case JobStatus.DONE.toLowerCase():
      return 'green';
    case JobStatus.FAILED.toLowerCase():
      return 'orange';
    case JobStatus.DELETED.toLowerCase():
      return 'red';
    default:
      return 'gray';
  }
};


/**
 * Extracts and normalizes the job status from a job object.
 * Handles status formats.
 *
 * @param job - Job object containing a status field
 * @returns Normalized lowercase status string
 */
export function getJobStatus(job: IScheduledJobDetailData): string {
  return (
    (typeof job?.status === 'string'
      ? job.status
      : job?.status?.value
    ) || ''
  ).toLowerCase();
}

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