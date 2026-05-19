/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Shared Symfony API envelope types.
 *
 * Kept as a local shim so existing imports do not churn, but the actual
 * contract now lives in `sh-selfhelp_shared`.
 */
export type { IMeta, IBaseApiResponse, IApiError, IApiMeta } from '../../../shared';