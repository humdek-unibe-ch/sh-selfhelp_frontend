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