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
    Tooltip,
    Menu,
    UnstyledButton,
} from "@mantine/core";
import { Schedule, ScheduleEventData, ScheduleViewLevel } from "@mantine/schedule";
import "@mantine/schedule/styles.css";
import dayjs from 'dayjs';
import { useScheduledJobsAll } from "../../../../../hooks/useScheduledJobs";
import { useEffect, useMemo, useState } from "react";
import { IScheduledJobFilters } from "../../../../../types/responses/admin/scheduled-jobs.types";
import { getJobStatusColor } from "../utils/job-status";
import { useUsers } from "../../../../../hooks/useUsers";
import { IUserBasic } from "../../../../../types/responses/admin/users.types";
import { useActions } from "../../../../../hooks/useActions";
import { ScheduledJobDetailsModal } from "../scheduled-job-details-modal/ScheduledJobDetailsModal";
import { useScheduledJobManager } from "../utils/hooks/useScheduledJobManager";
import { DeleteJobModal } from "../delete-job-modal/DeleteJobModal";
import { IconPlayerPlay, IconTrash } from "@tabler/icons-react";

export default function ScheduledJobsCalendar() {
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [currentActionId, setCurrentActionId] = useState<number | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<number | undefined>(undefined);
    const [modalOpened, setModalOpened] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    jobId: number | null;
    description?: string;
    } | null>(null);
    const {
        handleExecuteJob,
        handleDeleteJob,
        handleConfirmDelete,
        deleteModal,
        setDeleteModal,
    } = useScheduledJobManager();

    const [view, setView] = useState<ScheduleViewLevel>("week");
    const [params, setParams] = useState<IScheduledJobFilters>({
            pageSize: 50,
            dateType: 'date_to_be_executed',
            dateFrom: dayjs().startOf('week').format('YYYY-MM-DD'),
            dateTo: dayjs().endOf('week').format('YYYY-MM-DD'),
            includeTransactions: true,
            userId: undefined,
            actionId: undefined
    });

    // Fetching necessary data via custom hooks.
    const { data: scheduledJobsData, isFetching } = useScheduledJobsAll(params);
    const { data: usersData } = useUsers();
    const { data: actionsData } = useActions({ pageSize: 100 });

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
    value: user.id,
    label: `[${user.id}] - ${user.email}`,
    }));

    /**
     * Transform actions into Select options
     */
    const actionOptions = useMemo(() => {
        return (actionsData?.actions || []).map((action) => ({
            value: action.id,
            label: action.name,
        }));
    }, [actionsData]);


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

    /**
     * FILTERS BUTTONS HANDLERS
     * Apply filters
     * Reset Filters
     */
    const handleApplyFilters = () => {
    const newParams: IScheduledJobFilters = {
        ...params,
        userId: currentUserId ?? undefined,
        actionId: currentActionId ?? undefined,
    };
    setParams(newParams);
    };

    const handleResetFilters = () => {
        setCurrentUserId(null);
        setCurrentActionId(null);
        setParams((prev) => ({
            ...prev,
            userId: undefined,
            actionId: undefined,
        }));
    };

    // Close pop up action menu on scroll or escape
    useEffect(() => {
    if (!contextMenu) return;

    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
        setContextMenu(null);
        }
    };

    const handleScroll = () => {
        setContextMenu(null);
    };

    globalThis.addEventListener("keydown", handleEscape);
    globalThis.addEventListener("scroll", handleScroll, true); 

    return () => {
        globalThis.removeEventListener("keydown", handleEscape);
        globalThis.removeEventListener("scroll", handleScroll, true);
    };
    }, [contextMenu]);

    return (
      <Paper withBorder p="md" radius="md" shadow="sm">
        <Stack gap="lg">
          {/* Header */}
          <Title order={4} fw={500} c="dimmed">
            Job schedule calendar
          </Title>

          {/* User & Action Filters */}
          <Paper withBorder p="sm" bg="gray.0">
            <Group align="flex-end" gap="md">
              <Select
                label="User"
                placeholder="All users"
                data={userOptions}
                value={currentUserId}
                onChange={(value) =>
                  setCurrentUserId(value ? Number(value) : null)
                }
                clearable
                searchable
                flex={1}
              />

              <Select
                label="Action"
                placeholder="All actions"
                data={actionOptions}
                value={currentActionId}
                onChange={(val) => setCurrentActionId(val ? Number(val) : null)}
                clearable
                searchable
                flex={1}
              />

              <Button
                variant="filled"
                color="blue"
                onClick={handleApplyFilters}
                loading={isFetching}
              >
                Apply Filters
              </Button>
              <Button
                variant="filled"
                color="red"
                onClick={handleResetFilters}
                disabled={
                  currentUserId === null &&
                  currentActionId === null &&
                  !params.userId &&
                  !params.actionId
                }
              >
                Reset
              </Button>
            </Group>
          </Paper>

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
              onViewChange={(newView) => {
                setView(newView);
                updateRange(dayjs().format("YYYY-MM-DD"), newView);
              }}
              onEventClick={(event) => {
                setSelectedJobId(Number(event.id));
                setModalOpened(true);
              }}
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
                  <Tooltip
                    multiline
                    w={250}
                    withArrow
                    label={
                      <Stack gap={4}>
                        <Text size="xs" fw={700} c="blue.2">
                          {customPayload.title} - {customPayload.job_type}
                        </Text>
                        <Text size="xs" c="white">
                          {customPayload.description || "No description"}
                        </Text>
                        <Text size="10px" c="dimmed">
                          ID: #{customPayload.id}
                        </Text>
                      </Stack>
                    }
                  >
                    {/* The <div> ensures the Tooltip can attach the necessary ref and event listeners without throwing error. */}
                    <UnstyledButton
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        jobId: Number(customPayload.id),
                        description: customPayload.description,
                        });
                    }}
                    style={{ height: "100%", width: "100%" }}
                    >
                      <Stack
                        gap={0}
                        px={6}
                        py={4}
                        h="100%"
                        style={{ overflow: "hidden" }}
                      >
                        <Group gap={4} wrap="nowrap">
                          <Text size="xs" fw={700} lh={1} c="dark.9">
                            {customPayload.title}
                          </Text>
                          <Text
                            size="xs"
                            fw={800}
                            lh={1}
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
                            lh={1.2}
                            fw={500}
                            c="gray.7"
                            lineClamp={1}
                          >
                            {customPayload.description}
                          </Text>
                        )}
                      </Stack>
                    </UnstyledButton>
                  </Tooltip>
                );
              }}
            />
          </Box>

          {contextMenu && (
            <Menu
              opened
              onClose={() => setContextMenu(null)}
              position="bottom-start"
              withinPortal
            >
              <Menu.Target>
                <div
                  style={{
                    position: "fixed",
                    top: contextMenu.y,
                    left: contextMenu.x,
                    width: 1,
                    height: 1,
                  }}
                />
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconPlayerPlay size={14} />}
                  onClick={() => {
                    handleExecuteJob(contextMenu.jobId!);
                    setContextMenu(null);
                  }}
                >
                  Execute Job
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={() => {
                    handleDeleteJob(
                      contextMenu.jobId!,
                      contextMenu.description ?? '',
                    );
                    setContextMenu(null);
                  }}
                >
                  Delete Job
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}

          <ScheduledJobDetailsModal
            opened={modalOpened}
            onClose={() => {
              setModalOpened(false);
              setSelectedJobId(undefined);
            }}
            jobId={selectedJobId}
            onExecuteJob={handleExecuteJob}
            onDeleteJob={handleDeleteJob}
          />

          <DeleteJobModal
            opened={deleteModal.opened}
            onClose={() =>
              setDeleteModal({
                opened: false,
                jobId: undefined,
                jobDescription: undefined,
              })
            }
            jobId={deleteModal.jobId}
            jobDescription={deleteModal.jobDescription}
            onConfirm={handleConfirmDelete}
          />
        </Stack>
      </Paper>
    );
}