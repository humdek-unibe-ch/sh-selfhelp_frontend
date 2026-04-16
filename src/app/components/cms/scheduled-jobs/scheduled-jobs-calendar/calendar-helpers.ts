import dayjs from "dayjs";
import { ScheduleEventData } from "@mantine/schedule";
import { IScheduledJob } from "../../../../../types/responses/admin/scheduled-jobs.types";
import { getJobStatusColor } from "../utils/job-status";

/**
 * Custom payload attached to every `ScheduleEventData.payload`.
 * Carries the original job metadata needed by hover cards and context menus
 * without coupling the calendar to the raw API shape.
 */
export interface IJobEventPayload {
  /** Numeric ID of the scheduled job */
  jobId: number;
  /** Human-readable description of the job */
  description: string;
  /** Job type label (e.g. "email", "cron", etc.) */
  jobType: string;
  /** Current status string (Queued / Done / Failed / Deleted) */
  status: string;
  /** Email of the user who owns the job */
  userEmail: string;
  /** ISO date string when the job was created */
  dateCreated: string;
  /** ISO date string when the job is scheduled to execute */
  dateToBeExecuted: string;
  /** ISO date string when the job was actually executed, or null */
  dateExecuted: string | null;
  /** Name of the associated action, or null */
  actionName: string | null;
}

/**
 * Transforms an array of raw `IScheduledJob` API objects into
 * `ScheduleEventData[]` consumable by the Mantine `Schedule` component.
 *
 * Each event gets a 30-minute duration, a color derived from its status,
 * and a title formatted as `"HH:mm [JobType] description"` for concise
 * display inside default event chips.
 *
 * @param jobs - Raw scheduled job records from the API
 * @returns Array of schedule events with embedded {@link IJobEventPayload}
 */
export function mapJobsToEvents(jobs: IScheduledJob[]): ScheduleEventData[] {
  return jobs.map((job) => {
    const startDate = dayjs(job.date_to_be_executed);
    const jobType = job.job_types || "Job";
    const time = startDate.format("HH:mm");

    return {
      id: job.id,
      title: `${time} [${jobType}] ${job.description}`,
      start: startDate.format("YYYY-MM-DD HH:mm:ss"),
      end: startDate.add(30, "minutes").format("YYYY-MM-DD HH:mm:ss"),
      color: getJobStatusColor(job.status),
      payload: {
        jobId: job.id,
        description: job.description,
        jobType,
        status: job.status,
        userEmail: job.user_email,
        dateCreated: job.date_created,
        dateToBeExecuted: job.date_to_be_executed,
        dateExecuted: job.date_executed,
        actionName: job.action_name,
      } satisfies IJobEventPayload,
    };
  });
}

/**
 * Maps a job status string to a Mantine color token for use in `Badge`.
 *
 * @param status - Raw status string (case-insensitive)
 * @returns Mantine color name suitable for the `color` prop
 */
export function getStatusBadgeColor(status: string): string {
  return getJobStatusColor(status);
}
