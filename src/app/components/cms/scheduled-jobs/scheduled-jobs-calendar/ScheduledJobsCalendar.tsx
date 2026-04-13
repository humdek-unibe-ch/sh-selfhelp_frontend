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
} from "@mantine/core";
import { Schedule, ScheduleEventData } from "@mantine/schedule";
import "@mantine/schedule/styles.css";
import dayjs from 'dayjs';
import { useScheduledJobs } from "../../../../../hooks/useScheduledJobs";
import { useMemo, useState } from "react";
import { IScheduledJobFilters } from "../../../../../types/responses/admin/scheduled-jobs.types";
import { getJobStatusColor } from "../utils/job-status";
const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

const today = dayjs().format('YYYY-MM-DD');


const initialEvents: ScheduleEventData[] = [
    {
        id: 1,
        title: 'Morning Standup',
        start: `${today} 09:00:00`,
        end: `${today} 09:30:00`,
        color: 'blue',
    },
    {
        id: 2,
        title: 'Team Meeting',
        start: `${today} 10:00:00`,
        end: `${today} 11:30:00`,
        color: 'green',
    },
    {
        id: 3,
        title: 'Lunch Break',
        start: `${today} 12:00:00`,
        end: `${today} 13:00:00`,
        color: 'orange',
    },
    {
        id: 4,
        title: 'Code RecalendarView',
        start: `${tomorrow} 14:00:00`,
        end: `${tomorrow} 15:00:00`,
        color: 'violet',
    },
    {
        id: 5,
        title: 'Client Call',
        start: `${tomorrow} 15:30:00`,
        end: `${tomorrow} 16:30:00`,
        color: 'cyan',
    },
    {
        id: 6,
        title: 'Client Call 2',
        start: `${tomorrow} 15:30:00`,
        end: `${tomorrow} 16:30:00`,
        color: 'cyan',
    },
    {
        id: 7,
        title: 'Client Call 3',
        start: `${tomorrow} 15:30:00`,
        end: `${tomorrow} 16:30:00`,
        color: 'cyan',
    },
    {
        id: 8,
        title: 'Client Call 4',
        start: `${tomorrow} 15:30:00`,
        end: `${tomorrow} 16:30:00`,
        color: 'cyan',
    },
    {
        id: 9,
        title: 'All Day Conference',
        start: `${today} 00:00:00`,
        end: dayjs(today).add(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        color: 'red',
    },
];

export default function ScheduledJobsCalendar() {
    const [params, setParams] = useState<IScheduledJobFilters>({
            page: 1,
            pageSize: 20,
            dateType: 'date_to_be_executed',
            dateFrom: new Date().toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0],
            includeTransactions: true,
    });

    const { data: scheduledJobsData, isLoading, error, refetch } = useScheduledJobs(params);

  const events = useMemo(() => {
    const jobs = scheduledJobsData?.data?.scheduledJobs || [];

    return jobs.map((job: any) => {
      const startDate = dayjs(job.date_to_be_executed);

      return {
        id: job.id,
        title: dayjs(job.date_to_be_executed).format("HH:mm"), // as date to be executed
        start: startDate.toDate(),
        end: startDate.add(60, "minutes").toDate(),
        color: getJobStatusColor(job.status),
        description: job.description,
        job_type: job.job_types,
      };
    });
  }, [scheduledJobsData]);

    return (
      <Paper withBorder p="md" radius="md" shadow="sm">
        <Stack gap="lg">
          {/* Title Section */}
          <Title order={4} fw={500} c="dimmed">
            Job schedule calendar calendarView
          </Title>

          {/* Filters Section */}
          <Stack gap="xs">
            <Group align="flex-end">
              <Select
                label="Select user"
                placeholder="Search user"
                data={["[7k392wvo] cheyenne.takiya@hotmail.com - ctakis"]}
                defaultValue="[7k392wvo] cheyenne.takiya@hotmail.com - ctakis"
                flex={1}
              />
              <Button variant="filled" color="blue">
                calendarView
              </Button>
            </Group>

            <Select
              label="Filter for action"
              placeholder="All actions"
              data={["All actions", "add_group", "notification"]}
              defaultValue="All actions"
            />
          </Stack>

          <Box mih={600}>
            <Schedule
              events={events}
              renderEventBody={(payload) => {
                const customPayload = payload as ScheduleEventData & { job_type: string; description: string };
                console.log(customPayload);
                return (
                  <Stack gap={0} px={4} h="100%">
                    <Group gap={4} wrap="nowrap">
                      <Text size="xs" fw={500} lh={1.2} c="dark.9">
                      {customPayload.title} 
                      </Text>
                      <Text size="xs" fw={700} lh={1.2} c="blue.7" truncate="end">
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
                        style={{ opacity: 0.9 }}
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
