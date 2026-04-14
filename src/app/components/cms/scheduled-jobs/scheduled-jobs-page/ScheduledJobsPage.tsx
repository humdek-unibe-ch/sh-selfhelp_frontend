"use client";

import { useState } from 'react';
import { ScheduledJobsList } from '../scheduled-jobs-list/ScheduledJobsList';
import { ScheduledJobDetailsModal } from '../scheduled-job-details-modal/ScheduledJobDetailsModal';
import { DeleteJobModal } from '../delete-job-modal/DeleteJobModal';
import { BulkDeleteJobsModal } from '../bulk-delete-jobs-modal/BulkDeleteJobsModal';
import { notifications } from '@mantine/notifications';
import { useScheduledJobManager } from '../utils/hooks/useScheduledJobManager';

export function ScheduledJobsPage() {
    const { 
        detailsModal, setDetailsModal, 
        deleteModal, setDeleteModal,
        handleViewJob, handleExecuteJob, handleDeleteJob, handleConfirmDelete,
        deleteJobMutation
    } = useScheduledJobManager();

    const [bulkDeleteModal, setBulkDeleteModal] = useState<{
        opened: boolean;
        jobIds: number[];
        jobDescriptions: string[];
    }>({
        opened: false,
        jobIds: [],
        jobDescriptions: [],
    });

    // Handle bulk delete jobs
    const handleBulkDeleteJobs = (jobIds: number[], descriptions: string[]) => {
        setBulkDeleteModal({
            opened: true,
            jobIds,
            jobDescriptions: descriptions,
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