"use client";

import {
    Paper,
    Title,
    Select,
    Group,
    Button,
    Stack,
    Box,
    ActionIcon,
} from "@mantine/core";
import { Schedule, ScheduleEventData, ScheduleViewLevel } from "@mantine/schedule";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import "@mantine/schedule/styles.css";
import dayjs from 'dayjs';
import { useState } from "react";
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
        title: 'All Day Conference',
        start: `${today} 00:00:00`,
        end: dayjs(today).add(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        color: 'red',
    },
];

export default function ScheduledJobsCalendar() {
    const [calendarView, setCalendarcalendarView] = useState<ScheduleViewLevel>('month');

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

                {/* Calendar Header / Controls */}
                <Group justify="space-between" mt="md">
                    <Group gap={5}>
                        <ActionIcon variant="filled" color="blue" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                        <ActionIcon variant="filled" color="blue" size="lg">
                            <IconChevronRight size={20} />
                        </ActionIcon>
                        <Button variant="filled" color="blue">
                            today
                        </Button>
                    </Group>

                    <Title order={2}>December 2025</Title>
                    <Group gap={0}>
                        <Button
                            onClick={() => setCalendarcalendarView('month')}
                            variant={calendarView === 'month' ? "filled" : "outline"}
                            color="blue"
                            style={{ borderRadius: "4px 0 0 4px" }}
                        >
                            month
                        </Button>
                        <Button
                            onClick={() => setCalendarcalendarView('week')}
                            variant={calendarView === 'week' ? "filled" : "outline"}
                            color="blue"
                            style={{ borderRadius: 0 }}
                        >
                            week
                        </Button>
                        <Button
                            onClick={() => setCalendarcalendarView('day')}
                            variant={calendarView === 'day' ? "filled" : "outline"}
                            color="blue"
                            style={{ borderRadius: 0 }}
                        >
                            day
                        </Button>
                    </Group>
                </Group>

            <Box mih={600}>
                <Schedule events={initialEvents} view={calendarView} />
            </Box>
        </Stack>
    </Paper >
  );
}
