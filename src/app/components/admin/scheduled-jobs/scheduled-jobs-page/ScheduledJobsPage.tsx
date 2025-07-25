"use client";

import { useState } from 'react';
import { ScheduledJobsList } from '../scheduled-jobs-list/ScheduledJobsList';
import { ScheduledJobDetailsModal } from '../scheduled-job-details-modal/ScheduledJobDetailsModal';
import { DeleteJobModal } from '../delete-job-modal/DeleteJobModal';
import { BulkDeleteJobsModal } from '../bulk-delete-jobs-modal/BulkDeleteJobsModal';
import { useExecuteScheduledJobMutation, useDeleteScheduledJobMutation } from '../../../../../hooks/useScheduledJobs';
import { notifications } from '@mantine/notifications';

export function ScheduledJobsPage() {
    // Mutations
    const executeJobMutation = useExecuteScheduledJobMutation();
    const deleteJobMutation = useDeleteScheduledJobMutation();

    const [detailsModal, setDetailsModal] = useState<{
        opened: boolean;
        jobId?: number;
    }>({
        opened: false,
        jobId: undefined,
    });

    const [deleteModal, setDeleteModal] = useState<{
        opened: boolean;
        jobId?: number;
        jobDescription?: string;
    }>({
        opened: false,
        jobId: undefined,
        jobDescription: undefined,
    });

    const [bulkDeleteModal, setBulkDeleteModal] = useState<{
        opened: boolean;
        jobIds: number[];
        jobDescriptions: string[];
    }>({
        opened: false,
        jobIds: [],
        jobDescriptions: [],
    });

    // Handle view job details
    const handleViewJob = (jobId: number) => {
        setDetailsModal({
            opened: true,
            jobId,
        });
    };

    // Handle execute job
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
            onError: (error) => {
                notifications.show({
                    title: 'Error',
                    message: error.message || 'Failed to execute job',
                    color: 'red',
                });
            },
        });
    };

    // Handle delete single job
    const handleDeleteJob = (jobId: number, description: string) => {
        setDeleteModal({
            opened: true,
            jobId,
            jobDescription: description,
        });
    };

    // Handle bulk delete jobs
    const handleBulkDeleteJobs = (jobIds: number[], descriptions: string[]) => {
        setBulkDeleteModal({
            opened: true,
            jobIds,
            jobDescriptions: descriptions,
        });
    };

    // Handle confirm single delete
    const handleConfirmDelete = async (jobId: number) => {
        deleteJobMutation.mutate(jobId, {
            onSuccess: () => {
                notifications.show({
                    title: 'Success',
                    message: 'Job deleted successfully',
                    color: 'green',
                });
                setDeleteModal({ opened: false, jobId: undefined, jobDescription: undefined });
            },
            onError: (error) => {
                notifications.show({
                    title: 'Error',
                    message: error.message || 'Failed to delete job',
                    color: 'red',
                });
            },
        });
    };

    // Handle confirm bulk delete
    const handleConfirmBulkDelete = async (jobIds: number[]) => {
        // For now, delete jobs one by one
        // TODO: Implement bulk delete API endpoint
        for (const jobId of jobIds) {
            try {
                await deleteJobMutation.mutateAsync(jobId);
            } catch (error) {
                console.error(`Failed to delete job ${jobId}:`, error);
            }
        }
        
        notifications.show({
            title: 'Success',
            message: `Deleted ${jobIds.length} job(s)`,
            color: 'green',
        });
        
        setBulkDeleteModal({ opened: false, jobIds: [], jobDescriptions: [] });
    };

    return (
        <>
            <ScheduledJobsList
                onViewJob={handleViewJob}
                onExecuteJob={handleExecuteJob}
                onDeleteJob={handleDeleteJob}
                onBulkDeleteJobs={handleBulkDeleteJobs}
            />
            
            <ScheduledJobDetailsModal
                opened={detailsModal.opened}
                onClose={() => setDetailsModal({ opened: false, jobId: undefined })}
                jobId={detailsModal.jobId}
                onExecuteJob={handleExecuteJob}
                onDeleteJob={handleDeleteJob}
            />

            <DeleteJobModal
                opened={deleteModal.opened}
                onClose={() => setDeleteModal({ opened: false, jobId: undefined, jobDescription: undefined })}
                jobId={deleteModal.jobId}
                jobDescription={deleteModal.jobDescription}
                onConfirm={handleConfirmDelete}
            />

            <BulkDeleteJobsModal
                opened={bulkDeleteModal.opened}
                onClose={() => setBulkDeleteModal({ opened: false, jobIds: [], jobDescriptions: [] })}
                jobIds={bulkDeleteModal.jobIds}
                jobDescriptions={bulkDeleteModal.jobDescriptions}
                onConfirm={handleConfirmBulkDelete}
            />
        </>
    );
} 