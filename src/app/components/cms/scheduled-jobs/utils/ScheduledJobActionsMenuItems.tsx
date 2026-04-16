import { Menu } from "@mantine/core";
import { IconEye, IconPlayerPlay, IconTrash } from "@tabler/icons-react";
import { isJobActionAllowed } from "./job-status";

interface IScheduledJobActionsMenuItemsProps {
  jobId: number;
  status: string;
  description: string;
  onViewJob?: (jobId: number) => void;
  onExecuteJob?: (jobId: number) => void;
  onDeleteJob?: (jobId: number, description: string) => void;
  onActionComplete?: () => void;
}

export function ScheduledJobActionsMenuItems({
  jobId,
  status,
  description,
  onViewJob,
  onExecuteJob,
  onDeleteJob,
  onActionComplete,
}: IScheduledJobActionsMenuItemsProps) {
  const actionsAllowed = isJobActionAllowed(status);

  return (
    <>
      {onViewJob && (
        <Menu.Item
          leftSection={<IconEye size={14} />}
          onClick={() => {
            onViewJob(jobId);
            onActionComplete?.();
          }}
        >
          View Details
        </Menu.Item>
      )}
      <Menu.Item
        leftSection={<IconPlayerPlay size={14} />}
        onClick={() => {
          onExecuteJob?.(jobId);
          onActionComplete?.();
        }}
        disabled={!actionsAllowed}
      >
        Execute Job
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        leftSection={<IconTrash size={14} />}
        color="red"
        onClick={() => {
          onDeleteJob?.(jobId, description);
          onActionComplete?.();
        }}
        disabled={!actionsAllowed}
      >
        Delete Job
      </Menu.Item>
    </>
  );
}
