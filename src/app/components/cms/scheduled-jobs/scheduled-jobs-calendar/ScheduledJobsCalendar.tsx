"use client";

import {
    Paper,
    Title,
    Select,
    Group,
    Button,
    Stack,
    Box,
    Text,
    LoadingOverlay,
} from "@mantine/core";
import { Schedule, ScheduleEventData, ScheduleViewLevel } from "@mantine/schedule";
import "@mantine/schedule/styles.css";
import dayjs from 'dayjs';
import { useScheduledJobsAll } from "../../../../../hooks/useScheduledJobs";
import { useMemo, useState } from "react";
import { IScheduledJobFilters } from "../../../../../types/responses/admin/scheduled-jobs.types";
import { getJobStatusColor } from "../utils/job-status";
import { useUsers } from "../../../../../hooks/useUsers";
import { IUserBasic } from "../../../../../types/responses/admin/users.types";

export default function ScheduledJobsCalendar() {
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [view, setView] = useState<ScheduleViewLevel>("week");
    const [params, setParams] = useState<IScheduledJobFilters>({
            pageSize: 50,
            dateType: 'date_to_be_executed',
            dateFrom: dayjs().startOf('week').format('YYYY-MM-DD'),
            dateTo: dayjs().endOf('week').format('YYYY-MM-DD'),
            includeTransactions: true,
            userId: undefined,
    });

    // Fetching data via custom hook.
    const { data: scheduledJobsData, isFetching } = useScheduledJobsAll(params);
    const { data: usersData } = useUsers();

    /**
     * DATA MAPPING
     * Transform API response into the format required by @mantine/schedule.
     * useMemo ensures we only re-map when the source data changes.
     */
    const events = useMemo(() => {
        return (scheduledJobsData || []).map((job) => {
            const startDate = dayjs(job.date_to_be_executed);

            return {
                id: job.id,
                title: dayjs(job.date_to_be_executed).format("HH:mm"),
                start: startDate.toDate(),
                // Setting a default 60-minute duration for visualization
                end: startDate.add(60, "minutes").toDate(),
                color: getJobStatusColor(job.status),
                // Custom properties passed into the payload for the renderer
                description: job.description,
                job_type: job.job_types,
            };
        });
    }, [scheduledJobsData]);

    /**
     * Transform users api data to options for users dropdown.
     * Format: "[id] - email"
     */
    const userOptions = (usersData?.users || []).map((user: IUserBasic) => ({
    value: String(user.id),
    label: `[${user.id}] - ${user.email}`,
    }));


    /**
     * CALENDAR HANDLER
     * Syncs the calendar's internal navigation (date/view changes) 
     * with the API params to fetch the correct data range.
     */
    const updateRange = (newDate: string, view: ScheduleViewLevel) => {
      const start = dayjs(newDate).startOf(view);
      const end = dayjs(newDate).endOf(view);

      setParams((prev) => ({
        ...prev,
        dateFrom: start.format("YYYY-MM-DD"),
        dateTo: end.format("YYYY-MM-DD"),
      }));
    };

    const handleApply = () => {
    const newParams: IScheduledJobFilters = {
        ...params,
        userId: currentUserId ?? undefined,
    };
    setParams(newParams);
    };

    return (
      <Paper withBorder p="md" radius="md" shadow="sm">
        <Stack gap="lg">
          {/* Header */}
          <Title order={4} fw={500} c="dimmed">
            Job schedule calendar
          </Title>

          {/* User & Action Filters */}
          <Stack gap="xs">
            <Group align="flex-end">
            <Select
            label="Select user"
            placeholder="Search user"
            data={userOptions}
            value={currentUserId ? String(currentUserId) : null}
            onChange={(value) => setCurrentUserId(value ? Number(value) : null)}
            flex={1}
            />
              <Button variant="filled" color="blue" onClick={handleApply}>
                Apply
              </Button>
            </Group>

            <Select
              label="Filter for action"
              placeholder="All actions"
              data={["All actions", "add_group", "notification"]}
              defaultValue="All actions"
            />
          </Stack>

          {/* Calendar Display Area */}
          <Box mih={600} pos="relative">
            {/* Overlay provides feedback while the API is fetching new date ranges */}
            <LoadingOverlay
              visible={isFetching}
              overlayProps={{ blur: 0, backgroundOpacity: 0.4 }}
              loaderProps={{ size: "lg", style: { marginBottom: "auto" } }}
            />
            
            <Schedule
              onDateChange={(date) => updateRange(date, view)}
              onViewChange={(v) => setView(v)}
              events={events}
              /**
               * CUSTOM EVENT RENDERER
               * Defines how the actual "blocks" inside the calendar look.
               */
              renderEventBody={(payload) => {
                // Cast payload to include our custom job properties
                const customPayload = payload as ScheduleEventData & {
                  job_type: string;
                  description: string;
                };

                return (
                  <Stack gap={0} px={4} h="100%">
                    <Group gap={4} wrap="nowrap">
                      <Text size="xs" fw={500} lh={1.2} c="dark.9">
                        {customPayload.title}
                      </Text>
                      <Text
                        size="xs"
                        fw={700}
                        lh={1.2}
                        c="blue.7"
                        truncate="end"
                      >
                        - {customPayload.job_type}
                      </Text>
                    </Group>

                    {customPayload.description && (
                      <Text
                        size="10px"
                        mt={4}
                        mb={5}
                        lh={1.2}
                        fw={500}
                        c="black"
                        style={{ opacity: 0.8 }}
                        truncate="end"
                      >
                        {customPayload.description}
                      </Text>
                    )}
                  </Stack>
                );
              }}
            />
          </Box>
        </Stack>
      </Paper>
    );
}