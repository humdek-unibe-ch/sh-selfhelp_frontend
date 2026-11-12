/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { Alert, MultiSelect, Text } from '@mantine/core';
import { IconWorld } from '@tabler/icons-react';
import { useAllGroups } from '../../../../../hooks/useGroups';
import { useAllRoles } from '../../../../../hooks/useRoles';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { isAdminRole, withCurrentOptions } from '../assets.utils';

type TNamed = { id: number; name: string };

/** Always shown with the roles picker: the admin role is not in the list because it needs no grant. */
export const ADMINS_ALWAYS = 'Admins can always manage every asset.';

/** The groups and roles a picker can offer, and whether each list could be read. */
export interface IAccessLists {
  groupOptions: { value: string; label: string }[];
  roleOptions: { value: string; label: string }[];
  /** A picker can only change what it can list. */
  groupsLocked: boolean;
  rolesLocked: boolean;
  groupsFailed: boolean;
  rolesFailed: boolean;
  /** Whether the caller holds the admin role: only an admin may leave an asset with no managing role. */
  callerIsAdmin: boolean;
}

/**
 * The lists behind "Who can see it" and "Who can manage it". The roles list
 * leaves out the admin role: it manages every asset, so it is never picked (and
 * the server never stores it). `current` adds the groups and roles already on
 * the asset, so they show by name even when the full list cannot be read.
 */
export function useAccessLists(enabled: boolean, current: { groups?: TNamed[]; roles?: TNamed[] } = {}): IAccessLists {
  const { data: groupsData, isLoading: groupsLoading, isError: groupsFailed } = useAllGroups({ enabled });
  const { data: rolesData, isLoading: rolesLoading, isError: rolesFailed } = useAllRoles({ enabled });
  const { user } = useAuthUser();

  return {
    groupOptions: withCurrentOptions(
      (groupsData?.groups ?? []).map((group) => ({ value: String(group.id), label: group.name })),
      current.groups ?? [],
    ),
    roleOptions: withCurrentOptions(
      (rolesData?.roles ?? []).filter((role) => !isAdminRole(role)).map((role) => ({ value: String(role.id), label: role.name })),
      current.roles ?? [],
    ),
    groupsLocked: groupsLoading || groupsFailed,
    rolesLocked: rolesLoading || rolesFailed,
    groupsFailed,
    rolesFailed,
    callerIsAdmin: user?.roles.some(isAdminRole) ?? false,
  };
}

interface IWhoCanSeeProps {
  lists: IAccessLists;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  /** What the failure note says is not possible; differs per dialog. */
  failureNote?: string;
}

/** Groups that may open the file; none = public. */
export function WhoCanSeeField({ lists, value, onChange, disabled, failureNote }: IWhoCanSeeProps) {
  return (
    <>
      <MultiSelect
        label="Who can see it"
        description="Only members of the selected groups can open the file on the website and app. Leave empty to make it public."
        placeholder={value.length === 0 ? 'Everyone (public)' : undefined}
        data={lists.groupOptions}
        value={value}
        onChange={onChange}
        searchable
        clearable
        disabled={disabled || lists.groupsLocked}
      />
      {lists.groupsFailed && (
        <Text size="xs" c="dimmed">
          {failureNote ?? 'You are not allowed to list the groups, so who can see this asset cannot be chosen here.'}
        </Text>
      )}
    </>
  );
}

/** One compact warning: what "no groups" means. Shown while no group is picked. */
export function PublicWarning({ title = 'THIS ASSET IS PUBLIC' }: { title?: string }) {
  return (
    <Alert
      variant="filled"
      color="orange"
      icon={<IconWorld size={18} />}
      title={title}
      role="status"
      py={6}
      styles={{ title: { marginBottom: 0 }, body: { gap: 0 } }}
    >
      <Text size="xs" c="inherit">Anyone can open it, including visitors who are not logged in.</Text>
    </Alert>
  );
}

interface IWhoCanManageProps {
  lists: IAccessLists;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  /** Replaces the first sentence of the description (e.g. to say what an empty list does on upload). */
  description?: string;
  placeholder?: string;
  /** Show the "pick at least one role" error. */
  emptyError?: boolean;
  failureNote?: string;
}

/** Roles that may see, edit and delete the asset in the CMS (the admin role always can). */
export function WhoCanManageField({ lists, value, onChange, disabled, description, placeholder, emptyError, failureNote }: IWhoCanManageProps) {
  return (
    <>
      <MultiSelect
        label="Who can manage it"
        description={`${description ?? 'Roles that can see, edit and delete it in the CMS.'} ${ADMINS_ALWAYS}`}
        placeholder={placeholder}
        data={lists.roleOptions}
        value={value}
        onChange={onChange}
        searchable
        clearable
        disabled={disabled || lists.rolesLocked}
        error={emptyError ? 'Pick at least one role.' : undefined}
      />
      {lists.rolesFailed && (
        <Text size="xs" c="dimmed">
          {failureNote ?? 'You are not allowed to list the roles, so who can manage this asset cannot be chosen here.'}
        </Text>
      )}
    </>
  );
}
