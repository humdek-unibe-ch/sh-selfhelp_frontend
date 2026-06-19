/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { type TStylePlatform } from '@selfhelp/shared/registry';
import { type IBaseApiResponse } from '../common/response-envelope.types';

interface IStyleRelationship {
    id: number;
    name: string;
}

export interface IStyleRelationships {
    allowedChildren: IStyleRelationship[];
    allowedParents: IStyleRelationship[];
}

export interface IStyle {
    id: number;
    name: string;
    description: string | null;
    typeId: number;
    type: string;
    /**
     * Style render target from the backend catalog (`styleRenderTargets` lookup:
     * `web` | `mobile` | `both`). This is the authoritative per-style value the
     * add-section picker uses for badges and filtering. Optional for resilience:
     * when absent the picker falls back to the shared `@selfhelp/shared` registry
     * default. NULL on the backend serializes to `both`.
     */
    renderTarget?: TStylePlatform;
    relationships: IStyleRelationships;
}

export interface IStyleGroup {
    id: number;
    name: string;
    description: string | null;
    position: number;
    styles: IStyle[];
}

export type TStyleGroupsResponse = IBaseApiResponse<IStyleGroup[]>; 