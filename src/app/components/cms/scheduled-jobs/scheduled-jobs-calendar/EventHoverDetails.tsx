import { Stack, Group, Text, Badge, Divider } from "@mantine/core";
import {
  IconClock,
  IconUser,
  IconBolt,
  IconHash,
  IconFileText,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { IJobEventPayload, getStatusBadgeColor } from "./calendar-helpers";

/** Props for the {@link EventHoverDetails} component. */
interface IEventHoverDetailsProps {
  /** Job metadata extracted from the schedule event payload */
  payload: IJobEventPayload;
}

/**
 * Rich detail card rendered inside the `HoverCard.Dropdown` when
 * the user hovers over a calendar event in any view.
 *
 * Layout (top to bottom):
 * 1. Job ID badge + status badge
 * 2. Job type heading
 * 3. Description (if present, clamped to 4 lines)
 * 4. Divider
 * 5. Scheduled time, user email, action name
 * 6. Execution timestamp (if already executed)
 * 7. Interaction hint
 *
 * @param props - Contains the {@link IJobEventPayload} to display
 */
export function EventHoverDetails({ payload }: IEventHoverDetailsProps) {
  return (
    <Stack gap={5}>
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap={4} wrap="nowrap">
          <IconHash size={11} style={{ opacity: 0.5 }} />
          <Text size="xs" c="dimmed">
            {payload.jobId}
          </Text>
        </Group>
        <Badge
          size="xs"
          color={getStatusBadgeColor(payload.status)}
          variant="light"
        >
          {payload.status}
        </Badge>
      </Group>

      <Text size="sm" fw={700}>
        {payload.jobType}
      </Text>

      {payload.description && (
        <Group gap={5} wrap="nowrap" align="flex-start">
          <IconFileText
            size={13}
            style={{ opacity: 0.5, flexShrink: 0, marginTop: 1 }}
          />
          <Text size="xs" lineClamp={4}>
            {payload.description}
          </Text>
        </Group>
      )}

      <Divider my={1} />

      <Stack gap={3}>
        <Group gap={5} wrap="nowrap">
          <IconClock size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
          <Text size="xs">
            {dayjs(payload.dateToBeExecuted).format("ddd, MMM D · HH:mm")}
          </Text>
        </Group>

        {payload.userEmail && (
          <Group gap={5} wrap="nowrap">
            <IconUser size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
            <Text size="xs" truncate>
              {payload.userEmail}
            </Text>
          </Group>
        )}

        {payload.actionName && (
          <Group gap={5} wrap="nowrap">
            <IconBolt size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
            <Text size="xs" truncate>
              {payload.actionName}
            </Text>
          </Group>
        )}
      </Stack>

      {payload.dateExecuted && (
        <>
          <Divider my={1} />
          <Text size="xs" c="dimmed">
            Executed: {dayjs(payload.dateExecuted).format("MMM D, HH:mm")}
          </Text>
        </>
      )}

      <Text size="10px" c="dimmed" ta="right">
        Click for details · Right-click for actions
      </Text>
    </Stack>
  );
}
