/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Alert } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { usePageFields } from '../../../../../hooks/usePageDetails';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';

/**
 * What the signed-in person may do with the page open in the editor. The server
 * sends it with the page (`rights`: the route permission AND the grant on this
 * page; the superuser all). The editor only draws it; every write is checked on
 * the server again. A missing flag counts as "no".
 */
export interface IPageEditRights {
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  /** The page has been read, so the flags are the server's answer. */
  isKnown: boolean;
}

const NO_RIGHTS: IPageEditRights = { canUpdate: false, canDelete: false, canPublish: false, isKnown: false };

const PageRightsContext = createContext<IPageEditRights>(NO_RIGHTS);

export function PageRightsProvider({ pageId, children }: { pageId: number | null | undefined; children: ReactNode }) {
  const { data } = usePageFields(pageId ?? null, !!pageId);
  const rights = data?.rights;
  const value = useMemo<IPageEditRights>(
    () =>
      rights
        ? {
            canUpdate: rights.can_update === true,
            canDelete: rights.can_delete === true,
            canPublish: rights.can_publish === true,
            isKnown: true,
          }
        : NO_RIGHTS,
    [rights],
  );
  return <PageRightsContext.Provider value={value}>{children}</PageRightsContext.Provider>;
}

/** The rights of the page open in the editor. Outside the editor: none. */
export function usePageEditRights(): IPageEditRights {
  return useContext(PageRightsContext);
}

/**
 * Wraps a block of editor fields: when `readOnly`, the browser disables every
 * input, select and button inside (a disabled fieldset), so nothing can be
 * changed. Wrap only the fields, not tabs or section toggles people still need.
 */
export function ReadOnlyFieldset({ readOnly, children }: { readOnly: boolean; children: ReactNode }) {
  return (
    <fieldset disabled={readOnly} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      {children}
    </fieldset>
  );
}

/**
 * Shown at the top of the editor when the person may read the page but not
 * change it, with what is missing: the permission, or the grant on this page.
 */
export function PageReadOnlyBanner() {
  const { canUpdate, isKnown } = usePageEditRights();
  const { permissionChecker } = useAuthUser();
  if (!isKnown || canUpdate) return null;

  const holdsUpdate = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_PAGE_UPDATE) ?? false;
  return (
    <Alert color="gray" variant="light" icon={<IconLock size={16} />} title="Read only">
      You can view this page but not change it.{' '}
      {holdsUpdate
        ? 'Your roles have no update grant on this page (Roles → Page access).'
        : 'Changing pages needs the permission admin.page.update.'}
    </Alert>
  );
}
