/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Request interface for creating a new page
 */
export interface INavigationAssignmentRequest {
    menuKey: string;
    parentItemId?: number | null;
    position?: number | null;
    childSource?: string;
}

export interface ICreatePageRequest {
    keyword: string;
    pageTypeId?: number;
    pageAccessTypeCode: string;
    headless?: boolean;
    openAccess?: boolean;
    url?: string | null;
    protocol?: string | null;
    parent?: number | null;
    surface?: string;
    accessGroups?: number[];
    navigationAssignments?: INavigationAssignmentRequest[];
    syncUrlWithParent?: boolean;
    oldRoutePolicy?: 'ask' | 'keep_alias' | 'remove_old_route' | null;
}
