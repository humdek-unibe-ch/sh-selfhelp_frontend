/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The permission grid of the role form: what each permission shows, which ones
 * are locked, how they are laid out (one row per area, one column per action),
 * and how a change of the selection is completed.
 *
 * The server sends two facts for every permission, per signed-in person:
 * `can_assign` (they hold it, so they may put it into a role) and `implied_read`
 * (the area's read permission that goes with it). The picker only draws them.
 * The server stays the judge: it adds the read right of an area to every role
 * that gets another right of the area, and refuses rights the person does not
 * hold with its own text.
 */
import type { IPermission } from '../../../../../api/admin/permission.api';

/** Why an option cannot be ticked or unticked. Wording only; the server decides. */
export const LOCKED_NOT_HELD = 'You do not hold this permission yourself.';
export const LOCKED_IMPLIED_READ = 'Included while another right of this area is ticked.';

export interface IPermissionOption {
  /** Permission id as a string (the form keeps ids as strings). */
  value: string;
  /** What people read: the description, or the key when there is none. */
  label: string;
  /** Technical key (`admin.group.acl`). */
  name: string;
  /** Locked: the box cannot be ticked or unticked. */
  disabled: boolean;
  /** Why the option is locked, or `null` while it can be changed. */
  lockedReason: string | null;
}

/** The text people read: the description, or the key when the permission has none. */
function permissionLabel(permission: IPermission): string {
  const description = permission.description?.trim();
  return description ? description : permission.name;
}

/** Ids of the read rights that stay ticked because another right of their area is ticked. */
export function impliedReadIds(selected: readonly string[], permissions: readonly IPermission[]): Set<string> {
  const byId = new Map(permissions.map((permission) => [String(permission.id), permission]));
  const idByName = new Map(permissions.map((permission) => [permission.name, String(permission.id)]));

  const implied = new Set<string>();
  for (const id of selected) {
    const readName = byId.get(id)?.implied_read;
    const readId = readName ? idByName.get(readName) : undefined;
    if (readId) {
      implied.add(readId);
    }
  }
  return implied;
}

/**
 * The selection with the implied read of every ticked right added: what the
 * server makes of the list when it saves. Ticked ids keep their order.
 */
export function withImpliedReads(selected: readonly string[], permissions: readonly IPermission[]): string[] {
  const completed = [...selected];
  for (const id of impliedReadIds(selected, permissions)) {
    if (!completed.includes(id)) {
      completed.push(id);
    }
  }
  return completed;
}

/**
 * One option per permission. An option is locked when the person does not hold
 * the permission, or when it is the read right that another ticked right of its
 * area needs.
 */
export function buildPermissionOptions(
  permissions: readonly IPermission[],
  selected: readonly string[],
): IPermissionOption[] {
  const impliedIds = impliedReadIds(selected, permissions);

  return permissions.map((permission) => {
    const value = String(permission.id);
    const lockedReason = !permission.can_assign
      ? LOCKED_NOT_HELD
      : impliedIds.has(value)
        ? LOCKED_IMPLIED_READ
        : null;

    return {
      value,
      label: permissionLabel(permission),
      name: permission.name,
      disabled: lockedReason !== null,
      lockedReason,
    };
  });
}

/** The four actions that get a column of their own; every other action goes to "Other". */
export const GRID_ACTIONS = ['read', 'create', 'update', 'delete'] as const;
export type TGridAction = (typeof GRID_ACTIONS)[number];

/** One row of the grid: an area (`admin.group`, `surveyjs.survey`) and its permissions. */
export interface IPermissionArea {
  /** The key without the action: `admin.group`. */
  key: string;
  /** What people read: `Group`, `Page version`, `Surveyjs survey`. */
  label: string;
  /** The permission of each column action, when the area has it. */
  actions: Partial<Record<TGridAction, IPermissionOption>>;
  /** Every other action of the area (`acl`, `export`, `impersonate`), with its action word. */
  other: { action: string; option: IPermissionOption }[];
}

/** `admin.page_version` -> `Page version`; `admin` (for `admin.access`) -> `Admin area`. */
function areaLabel(key: string): string {
  if (key === 'admin') return 'Admin area';
  const words = key.replace(/^admin\./, '').replace(/[._]/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Lays the permissions out by area: the key up to its last dot is the area, the
 * last part is the action. Areas are sorted by label, the admin area first.
 */
export function groupPermissionsByArea(options: readonly IPermissionOption[]): IPermissionArea[] {
  const areas = new Map<string, IPermissionArea>();
  for (const option of options) {
    const dot = option.name.lastIndexOf('.');
    const key = dot > 0 ? option.name.slice(0, dot) : option.name;
    const action = dot > 0 ? option.name.slice(dot + 1) : option.name;

    let area = areas.get(key);
    if (!area) {
      area = { key, label: areaLabel(key), actions: {}, other: [] };
      areas.set(key, area);
    }
    if ((GRID_ACTIONS as readonly string[]).includes(action) && !area.actions[action as TGridAction]) {
      area.actions[action as TGridAction] = option;
    } else {
      area.other.push({ action: action.replace(/_/g, ' '), option });
    }
  }
  return [...areas.values()].sort((a, b) =>
    a.key === 'admin' ? -1 : b.key === 'admin' ? 1 : a.label.localeCompare(b.label),
  );
}

/** Search by area name and by what people read (description) or the key of any permission in it. */
export function filterPermissionAreas(areas: readonly IPermissionArea[], search: string): IPermissionArea[] {
  const query = search.trim().toLowerCase();
  if (query === '') return [...areas];
  return areas.filter((area) => {
    const options = [...Object.values(area.actions), ...area.other.map((item) => item.option)];
    return (
      area.label.toLowerCase().includes(query) ||
      area.key.toLowerCase().includes(query) ||
      options.some((option) => option.label.toLowerCase().includes(query) || option.name.toLowerCase().includes(query))
    );
  });
}
