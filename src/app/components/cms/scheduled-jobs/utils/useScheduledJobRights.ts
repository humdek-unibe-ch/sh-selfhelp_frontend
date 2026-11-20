/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';

/**
 * Which job controls the signed-in person may use, by the rights of their routes:
 * running a job needs admin.scheduled_job.execute, deleting one admin.scheduled_job.delete.
 */
export function useScheduledJobRights(): { canExecute: boolean; canDelete: boolean } {
  const { permissionChecker } = useAuthUser();
  return {
    canExecute: permissionChecker?.hasPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_EXECUTE) ?? false,
    canDelete: permissionChecker?.hasPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_DELETE) ?? false,
  };
}
