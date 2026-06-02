/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface ICreateRegistrationCodeRequest {
    code: string;
    id_groups: number;
}

export interface IGenerateRegistrationCodesRequest {
    count: number;
    id_groups: number;
}
