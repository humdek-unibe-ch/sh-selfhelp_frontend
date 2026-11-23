/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, Button, Group, Text } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { usePageFields } from '../../../../../hooks/usePageDetails';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { usePageEditLock, type IPageEditLock } from '../../../../../hooks/usePageEditLock';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';

/**
 * What the signed-in person may do with the page open in the editor. The server
 * sends it with the page (`rights`: the route permission AND the grant on this
 * page; the superuser all). The editor only draws it; every write is checked on
 * the server again. A missing flag counts as "no".
 *
 * The page's edit lock (live-sync contract C9) narrows it: while someone else
 * holds the lock, or the caller's own lock has ended, the page is read-only for
 * the caller, so `canUpdate`, `canDelete` and `canPublish` are all false and
 * every field of the editor follows the same read-only mode. `lock` tells why.
 *
 * Delete/publish-only callers (no update) watch the lock read-only: the banner
 * has no Take over, and `allowDelete` / `allowPublish` keep the buttons visible
 * so they can show as disabled with the holder in a tooltip (F259).
 */
export interface IPageEditRights {
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  /** Server said delete is allowed; show the control even while the lock pauses it. */
  allowDelete: boolean;
  /** Server said publish is allowed; show the control even while the lock pauses it. */
  allowPublish: boolean;
  /** The page has been read, so the flags are the server's answer. */
  isKnown: boolean;
  /** The edit lock of the page; `phase` is `off` for callers who only read. */
  lock: IPageEditLock;
}

const NO_LOCK: IPageEditLock = {
  phase: 'off',
  holder: null,
  reason: null,
  watchOnly: false,
  isWorking: false,
  takeOver: async () => undefined,
  retry: async () => undefined,
};

const NO_RIGHTS: IPageEditRights = {
  canUpdate: false,
  canDelete: false,
  canPublish: false,
  allowDelete: false,
  allowPublish: false,
  isKnown: false,
  lock: NO_LOCK,
};

const PageRightsContext = createContext<IPageEditRights>(NO_RIGHTS);

export function PageRightsProvider({ pageId, children }: { pageId: number | null | undefined; children: ReactNode }) {
  const { data } = usePageFields(pageId ?? null, !!pageId);
  const rights = data?.rights;
  const canUpdateRight = rights?.can_update === true;
  const watchOnly =
    !canUpdateRight && (rights?.can_delete === true || rights?.can_publish === true);
  // Editors take and renew the lock; delete/publish-only callers only read it.
  const lock = usePageEditLock(pageId, canUpdateRight || watchOnly, { watchOnly });
  const { phase, holder, reason, isWorking, takeOver, retry } = lock;
  const lockStopsWrites = phase === 'blocked' || phase === 'checking';
  const value = useMemo<IPageEditRights>(
    () =>
      rights
        ? {
            canUpdate: rights.can_update === true && !lockStopsWrites,
            canDelete: rights.can_delete === true && !lockStopsWrites,
            canPublish: rights.can_publish === true && !lockStopsWrites,
            allowDelete: rights.can_delete === true,
            allowPublish: rights.can_publish === true,
            isKnown: true,
            lock: { phase, holder, reason, watchOnly: lock.watchOnly, isWorking, takeOver, retry },
          }
        : NO_RIGHTS,
    [rights, lockStopsWrites, phase, holder, reason, lock.watchOnly, isWorking, takeOver, retry],
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

function holderName(lock: IPageEditLock): string {
  return lock.holder?.name?.trim() || 'Someone';
}

/**
 * Why the page's edit lock pauses Delete / Publish / Delete version, as a tooltip for the disabled
 * control. `null` while nothing is paused. It follows the lock's reason: another person's editing
 * names them; the caller's own ended lock says so instead of "Someone is editing".
 */
export function lockPauseLabel(lock: Pick<IPageEditLock, 'phase' | 'reason' | 'holder'>): string | null {
  if (lock.phase !== 'blocked') return null;
  switch (lock.reason) {
    case 'idle':
      return 'Your editing session ended. Continue editing to publish or delete.';
    case 'free':
      return 'Nobody is editing this page now. Start editing to publish or delete.';
    default:
      return `${lock.holder?.name?.trim() || 'Someone'} is editing this page`;
  }
}

/**
 * Shown while the edit lock keeps the caller out of an editable page: who is editing, or why the
 * caller's own lock ended, and the button to continue (take over, or ask again). Watch-only
 * callers (delete/publish) get a banner without a resume button.
 */
function PageLockBanner({ lock }: { lock: IPageEditLock }) {
  const [confirming, setConfirming] = useState(false);
  const name = holderName(lock);

  if (lock.watchOnly) {
    return (
      <Alert color="yellow" variant="light" icon={<IconLock size={16} />} title={`${name} is editing this page`} data-testid="page-lock-banner">
        <Text size="sm">
          {name} is editing this page. Publishing and deleting are paused until they are done.
        </Text>
      </Alert>
    );
  }

  let title: string;
  let body: string;
  let action: 'take-over' | 'retry' | 'continue';
  switch (lock.reason) {
    case 'taken_over':
      title = `${name} took over editing this page`;
      body = 'Your editing of this page ended. The page is read-only for you now.';
      action = 'take-over';
      break;
    case 'idle':
      title = 'Your editing session ended';
      body = 'The page was not changed for a while, so the edit lock was released. The page is read-only until you continue editing.';
      action = 'continue';
      break;
    case 'free':
      title = 'Nobody is editing this page now';
      body = 'The page is read-only until you start editing it.';
      action = 'retry';
      break;
    default:
      title = `${name} is editing this page`;
      body = 'You can look at the page, but not change it while they are editing.';
      action = 'take-over';
  }

  return (
    <>
      <Alert color="yellow" variant="light" icon={<IconLock size={16} />} title={title} data-testid="page-lock-banner">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text size="sm">{body}</Text>
          {action === 'take-over' ? (
            <Button size="xs" variant="light" color="yellow" onClick={() => setConfirming(true)} loading={lock.isWorking}>
              Take over
            </Button>
          ) : action === 'continue' ? (
            <Button size="xs" variant="light" color="yellow" onClick={() => void lock.takeOver()} loading={lock.isWorking}>
              Continue editing
            </Button>
          ) : (
            <Button size="xs" variant="light" color="yellow" onClick={() => void lock.retry()} loading={lock.isWorking}>
              Start editing
            </Button>
          )}
        </Group>
      </Alert>
      <ModalWrapper
        opened={confirming}
        onClose={() => setConfirming(false)}
        title="Take over editing?"
        size="sm"
        saveLabel="Take over"
        cancelLabel="Cancel"
        isLoading={lock.isWorking}
        onCancel={() => setConfirming(false)}
        onSave={() => {
          void lock.takeOver().finally(() => setConfirming(false));
        }}
      >
        <Text size="sm">
          {name} is editing this page. If you take over, they can no longer save their changes to it.
        </Text>
      </ModalWrapper>
    </>
  );
}

/**
 * Shown at the top of the editor when the person may read the page but not
 * change it, with what is missing: the permission, or the grant on this page.
 * When the edit lock is what keeps them out, it says who is editing instead.
 */
export function PageReadOnlyBanner() {
  const { canUpdate, isKnown, lock } = usePageEditRights();
  const { permissionChecker } = useAuthUser();
  if (!isKnown || lock.phase === 'checking') return null;
  if (lock.phase === 'blocked') return <PageLockBanner lock={lock} />;
  if (canUpdate || lock.watchOnly) return null;

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
