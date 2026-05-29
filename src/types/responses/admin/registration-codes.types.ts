/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IRegistrationCode {
    id: string; // alias for code — the PK
    code: string;
    id_groups: number;
    group_name: string;
    created_at: string;
    consumed_at: string | null;
    is_consumed: boolean;
}

export interface IRegistrationCodesListResponse {
    codes: IRegistrationCode[];
}
