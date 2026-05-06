/**
 * Shared Symfony API envelope types.
 *
 * Kept as a local shim so existing imports do not churn, but the actual
 * contract now lives in `sh-selfhelp_shared`.
 */
export type { IMeta, IBaseApiResponse, IApiError, IApiMeta } from '../../../shared';