"use client";

import {
  Paper,
  Select,
  Group,
  Button,
  Stack,
  Box,
  Text,
  LoadingOverlay,
  UnstyledButton,
  HoverCard,
  Menu,
  Badge,
  NumberInput,
} from "@mantine/core";
import {
  Schedule,
  ScheduleEventData,
  ScheduleViewLevel,
} from "@mantine/schedule";
import "@mantine/schedule/styles.css";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import { useScheduledJobsAll } from "../../../../../hooks/useScheduledJobs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IScheduledJobFilters } from "../../../../../types/responses/admin/scheduled-jobs.types";
import { STATUS_LEGEND } from "../utils/job-status";
import { useUsers } from "../../../../../hooks/useUsers";
import { IUserBasic } from "../../../../../types/responses/admin/users.types";
import { useActions } from "../../../../../hooks/useActions";
import { ScheduledJobDetailsModal } from "../scheduled-job-details-modal/ScheduledJobDetailsModal";
import { useScheduledJobManager } from "../utils/hooks/useScheduledJobManager";
import { DeleteJobModal } from "../delete-job-modal/DeleteJobModal";
import {
  IconRefresh,
  IconCalendar,
} from "@tabler/icons-react";
import { mapJobsToEvents, IJobEventPayload } from "./calendar-helpers";
import { EventHoverDetails } from "./EventHoverDetails";
import classes from "./ScheduledJobsCalendar.module.css";
import { ScheduledJobActionsMenuItems } from "../utils/ScheduledJobActionsMenuItems";

/**
 * Screen coordinates and metadata for the right-click context menu.
 * Stored in state when the user right-clicks an event; cleared on close.
 */
interface IContextMenuState {
  /** Viewport X coordinate where the menu should anchor */
  x: number;
  /** Viewport Y coordinate where the menu should anchor */
  y: number;
  /** ID of the targeted scheduled job */
  jobId: number | null;
  /** Job description — passed to the delete confirmation dialog */
  description?: string;
  /** Current job status — gates which context actions are available */
  status?: string;
}

/**
 * Full-featured calendar view for browsing and managing scheduled jobs.
 *
 * Renders a Mantine `Schedule` with four view levels (month / week / day / year).
 * Month, week, and day views share a unified custom `renderEvent` that provides:
 * - **HoverCard** on mouse hover with detailed job metadata
 * - **Left-click** to open the {@link ScheduledJobDetailsModal}
 * - **Right-click** context menu with Execute / Delete actions
 *
 * Year view uses Mantine defaults (no event-level interaction).
 *
 * The component auto-fetches jobs for the currently visible date range
 * and re-fetches whenever the user navigates dates, changes view, or applies filters.
 */
export default function ScheduledJobsCalendar() {
  const queryClient = useQueryClient();

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentActionId, setCurrentActionId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>(undefined);
  const [modalOpened, setModalOpened] = useState(false);
  const [contextMenu, setContextMenu] = useState<IContextMenuState | null>(null);
  const [maxEventsPerDay, setMaxEventsPerDay] = useState<number>(10);

  const {
    handleExecuteJob,
    handleDeleteJob,
    handleConfirmDelete,
    deleteModal,
    setDeleteModal,
  } = useScheduledJobManager();

  const [view, setView] = useState<ScheduleViewLevel>("month");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));

  const [params, setParams] = useState<IScheduledJobFilters>({
    pageSize: 50,
    dateType: "date_to_be_executed",
    dateFrom: dayjs().startOf("month").format("YYYY-MM-DD"),
    dateTo: dayjs().endOf("month").format("YYYY-MM-DD"),
    includeTransactions: true,
    userId: undefined,
    actionId: undefined,
  });

  const { data: scheduledJobsData, isFetching } = useScheduledJobsAll(params);
  const { data: usersData } = useUsers();
  const { data: actionsData } = useActions({ pageSize: 100 });

  /** Transformed events array for the Schedule component. */
  const events = useMemo(
    () => mapJobsToEvents(scheduledJobsData || []),
    [scheduledJobsData]
  );

  /** Dropdown options for the user filter, formatted as "[id] - email". */
  const userOptions = useMemo(
    () =>
      (usersData?.users || []).map((user: IUserBasic) => ({
        value: user.id,
        label: `[${user.id}] - ${user.email}`,
      })),
    [usersData]
  );

  /** Dropdown options for the action filter. */
  const actionOptions = useMemo(
    () =>
      (actionsData?.actions || []).map((action) => ({
        value: action.id,
        label: action.name,
      })),
    [actionsData]
  );

  /**
   * Recalculates the date range in `params` based on the given anchor date
   * and view level. Called whenever the user navigates or switches views.
   *
   * @param newDate  - ISO date string used as the centre of the range
   * @param currentView - Active view level to determine the range unit
   */
  const updateRange = useCallback(
    (newDate: string, currentView: ScheduleViewLevel) => {
      const unit = currentView === "year" ? "year" : currentView;
      const start = dayjs(newDate).startOf(unit);
      const end = dayjs(newDate).endOf(unit);

      setParams((prev) => ({
        ...prev,
        dateFrom: start.format("YYYY-MM-DD"),
        dateTo: end.format("YYYY-MM-DD"),
      }));
    },
    []
  );

  /**
   * Handles date navigation from the Schedule toolbar.
   * Updates both the displayed date and the data fetch range.
   *
   * @param newDate - ISO date string selected in the calendar
   */
  const handleDateChange = useCallback(
    (newDate: string) => {
      setDate(newDate);
      updateRange(newDate, view);
    },
    [view, updateRange]
  );

  /**
   * Handles view level change (month / week / day / year).
   * Updates the view state and recalculates the fetch range.
   *
   * @param newView - The newly selected view level
   */
  const handleViewChange = useCallback(
    (newView: ScheduleViewLevel) => {
      setView(newView);
      updateRange(date, newView);
    },
    [date, updateRange]
  );

  /** Applies the currently selected user / action filters to the query params. */
  const handleApplyFilters = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      userId: currentUserId ?? undefined,
      actionId: currentActionId ?? undefined,
    }));
  }, [currentUserId, currentActionId]);

  /** Clears all user / action filters and resets the query params. */
  const handleResetFilters = useCallback(() => {
    setCurrentUserId(null);
    setCurrentActionId(null);
    setParams((prev) => ({
      ...prev,
      userId: undefined,
      actionId: undefined,
    }));
  }, []);

  /**
   * Invalidates the `scheduledJobsAll` query to force a fresh fetch.
   * Used by the Refresh button as a clean alternative to mutating params.
   */
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["scheduledJobsAll"] });
  }, [queryClient]);

  /**
   * Opens the right-click context menu anchored to the pointer position.
   * Extracts the job payload from the event for the menu actions.
   *
   * @param e     - The native mouse event (prevented + stopped)
   * @param event - The `ScheduleEventData` that was right-clicked
   */
  const openContextMenu = useCallback(
    (e: React.MouseEvent, event: ScheduleEventData) => {
      e.preventDefault();
      e.stopPropagation();
      const payload = event.payload as IJobEventPayload | undefined;
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        jobId: Number(event.id),
        description: payload?.description ?? "",
        status: payload?.status ?? "",
      });
    },
    []
  );

  const openDetailsModal = useCallback((event: ScheduleEventData) => {
    setSelectedJobId(Number(event.id));
    setModalOpened(true);
  }, []);

  /**
   * Shared event renderer for month, week, and day views.
   *
   * Wraps each event in a `HoverCard` that shows {@link EventHoverDetails}
   * on hover. The underlying `UnstyledButton` handles:
   * - **onClick** → opens the {@link ScheduledJobDetailsModal}
   * - **onContextMenu** → opens the Execute / Delete context menu
   *
   * The native `title` prop from Mantine is stripped to prevent
   * a redundant browser tooltip from appearing alongside the HoverCard.
   *
   * @param event - Schedule event data containing the job payload
   * @param props - Internal Mantine props forwarded to the event DOM element
   * @returns A HoverCard-wrapped interactive event element
   */
  const renderEventWithHover = useCallback(
    (event: ScheduleEventData, props: Record<string, unknown>) => {
      const payload = event.payload as IJobEventPayload | undefined;
      const { title: _nativeTitle, ...restProps } = props;

      return (
        <HoverCard
          width={280}
          position="right"
          closeDelay={0}
          openDelay={250}
          transitionProps={{ duration: 80 }}
          withinPortal
        >
          <HoverCard.Target>
            <UnstyledButton
              {...restProps}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                openDetailsModal(event);
              }}
              onContextMenu={(e: React.MouseEvent) =>
                openContextMenu(e, event)
              }
            />
          </HoverCard.Target>
          <HoverCard.Dropdown>
            {payload ? (
              <EventHoverDetails payload={payload} />
            ) : (
              <Text size="xs">No details available</Text>
            )}
          </HoverCard.Dropdown>
        </HoverCard>
      );
    },
    [openContextMenu, openDetailsModal]
  );

  const renderMoreEventBody = useCallback(
    (event: ScheduleEventData) => {
      const payload = event.payload as IJobEventPayload | undefined;

      return (
        <HoverCard
          width={280}
          position="right"
          closeDelay={0}
          openDelay={250}
          transitionProps={{ duration: 80 }}
          withinPortal
        >
          <HoverCard.Target>
            <Box
              className={classes.moreEventInteractive}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                openDetailsModal(event);
              }}
              onContextMenu={(e: React.MouseEvent) =>
                openContextMenu(e, event)
              }
            >
              {event.title}
            </Box>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            {payload ? (
              <EventHoverDetails payload={payload} />
            ) : (
              <Text size="xs">No details available</Text>
            )}
          </HoverCard.Dropdown>
        </HoverCard>
      );
    },
    [openContextMenu, openDetailsModal]
  );

  /** Closes the context menu on Escape key or scroll anywhere on the page. */
  useEffect(() => {
    if (!contextMenu) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    const handleScroll = () => setContextMenu(null);

    globalThis.addEventListener("keydown", handleEscape);
    globalThis.addEventListener("scroll", handleScroll, true);

    return () => {
      globalThis.removeEventListener("keydown", handleEscape);
      globalThis.removeEventListener("scroll", handleScroll, true);
    };
  }, [contextMenu]);

  const totalEvents = events.length;
  const isFiltersActive =
    currentUserId !== null ||
    currentActionId !== null ||
    !!params.userId ||
    !!params.actionId;

  return (
    <Paper withBorder p="xs" radius="md" shadow="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap="xs" align="center">
            <IconCalendar size={18} />
            <Text size="md" fw={700}>
              Scheduled Jobs Calendar
            </Text>
            {totalEvents > 0 && (
              <Badge variant="light" color="gray" size="sm">
                {totalEvents}
              </Badge>
            )}
          </Group>
          <Group gap="sm" align="center">
            {STATUS_LEGEND.map((s) => (
              <Group key={s.label} gap={4} wrap="nowrap">
                <div
                  className={classes.legendDot}
                  style={{ backgroundColor: s.color }}
                />
                <Text size="xs" c="dimmed">
                  {s.label}
                </Text>
              </Group>
            ))}
          </Group>
        </Group>

        <Paper withBorder p="xs" className={classes.filterBar}>
          <Group align="flex-end" gap="sm">
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
              size="xs"
            />
            <Select
              label="Action"
              placeholder="All actions"
              data={actionOptions}
              value={currentActionId}
              onChange={(val) =>
                setCurrentActionId(val ? Number(val) : null)
              }
              clearable
              searchable
              flex={1}
              size="xs"
            />
            {view === "month" && (
              <NumberInput
                label="Events/day"
                value={maxEventsPerDay}
                onChange={(val) =>
                  setMaxEventsPerDay(
                    typeof val === "number" ? Math.max(1, val) : 10
                  )
                }
                min={1}
                max={50}
                step={5}
                w={90}
                size="xs"
              />
            )}
            <Button
              variant="filled"
              color="blue"
              onClick={handleApplyFilters}
              loading={isFetching}
              size="xs"
            >
              Apply Filters
            </Button>
            <Button
              variant="default"
              onClick={handleResetFilters}
              loading={isFetching}
              size="xs"
              disabled={!isFiltersActive}
            >
              Reset
            </Button>
            <Button
              variant="light"
              color="gray"
              size="xs"
              leftSection={<IconRefresh size={14} />}
              onClick={handleRefresh}
              loading={isFetching}
            >
              Refresh
            </Button>
          </Group>
        </Paper>

        <Box className={classes.calendarWrapper}>
          <LoadingOverlay
            visible={isFetching}
            overlayProps={{ blur: 0, backgroundOpacity: 0.35 }}
            loaderProps={{ size: "md" }}
          />

          {/*
            `onEventClick` is intentionally NOT set on Schedule because
            the year view does not support it and throws a console error.
            All click handling is done inside `renderEventWithHover`.
          */}
          <Schedule
            date={date}
            onDateChange={handleDateChange}
            view={view}
            onViewChange={handleViewChange}
            events={events}
            defaultView="month"
            monthViewProps={{
              maxEventsPerDay,
              renderEvent: renderEventWithHover,
              moreEventsProps: {
                renderEventBody: renderMoreEventBody,
              },
              highlightToday: true,
              firstDayOfWeek: 1,
            }}
            weekViewProps={{
              renderEvent: renderEventWithHover,
              highlightToday: true,
              firstDayOfWeek: 1,
              withCurrentTimeIndicator: true,
              withCurrentTimeBubble: true,
            }}
            dayViewProps={{
              renderEvent: renderEventWithHover,
              withCurrentTimeIndicator: true,
              withCurrentTimeBubble: true,
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
              <Menu.Label>Job #{contextMenu.jobId}</Menu.Label>
              {contextMenu.jobId && (
                <ScheduledJobActionsMenuItems
                  jobId={contextMenu.jobId}
                  status={contextMenu.status ?? ""}
                  description={contextMenu.description ?? ""}
                  onExecuteJob={handleExecuteJob}
                  onDeleteJob={handleDeleteJob}
                  onActionComplete={() => setContextMenu(null)}
                />
              )}
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
