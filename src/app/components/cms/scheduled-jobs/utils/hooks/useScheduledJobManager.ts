import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useExecuteScheduledJobMutation, useDeleteScheduledJobMutation } from '../../../../../../hooks/useScheduledJobs';
import { useQueryClient } from '@tanstack/react-query';

export function useScheduledJobManager() {
  const executeJobMutation = useExecuteScheduledJobMutation();
  const deleteJobMutation = useDeleteScheduledJobMutation();
  const queryClient = useQueryClient();

  // Modal States
  const [detailsModal, setDetailsModal] = useState<{ opened: boolean; jobId?: number }>({
    opened: false,
    jobId: undefined,
  });

  const [deleteModal, setDeleteModal] = useState<{ opened: boolean; jobId?: number; jobDescription?: string }>({
    opened: false,
    jobId: undefined,
    jobDescription: undefined,
  });

  // Action: Open Details
  const handleViewJob = (jobId: number) => {
    setDetailsModal({ opened: true, jobId });
  };

  // Action: Execute
  const handleExecuteJob = (jobId: number) => {
    executeJobMutation.mutate(jobId, {
      onSuccess: () => {
        notifications.show({
          title: 'Success',
          message: 'Job executed successfully',
          color: 'green',
        });
        setDetailsModal({ opened: false, jobId: undefined });
      },
      onError: (error: any) => {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to execute job',
          color: 'red',
        });
      },
    });
  };

  // Action: Open Delete Confirmation
  const handleDeleteJob = (jobId: number, description: string) => {
    setDeleteModal({
      opened: true,
      jobId,
      jobDescription: description,
    });
  };

  // Action: Confirm Delete
  const handleConfirmDelete = (jobId: number) => {
    deleteJobMutation.mutate(jobId, {
      onSuccess: () => {
        notifications.show({
          title: 'Success',
          message: 'Job deleted successfully',
          color: 'green',
        });
        setDeleteModal({ opened: false, jobId: undefined, jobDescription: undefined });
      },
      onError: (error: any) => {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to delete job',
          color: 'red',
        });
      },
    });
  };

  return {
    // States
    detailsModal,
    deleteModal,
    setDetailsModal,
    setDeleteModal,
    // Handlers
    handleViewJob,
    handleExecuteJob,
    handleDeleteJob,
    handleConfirmDelete,
    // Loading states if needed
    isExecuting: executeJobMutation.isPending,
    isDeleting: deleteJobMutation.isPending,
    // Mutations for bulk
    deleteJobMutation: deleteJobMutation
  };
}