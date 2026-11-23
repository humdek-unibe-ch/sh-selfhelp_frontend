/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Lost-push backstop for access changes (contract C5).
 *
 * Every API reply to a signed-in caller carries `X-Acl-Stamp`: a short hash over the caller's
 * `acl_version` and the versions of their groups and roles. `GET /auth/user-data` returns the
 * same value as `acl_stamp`. When a reply carries a stamp that differs from the one in the
 * cached user data, the access changed and this client missed the `acl` message (a dropped
 * stream, a tab that was asleep). Invalidating the user data then runs the existing cascade
 * (`useAclVersionWatcher`).
 *
 * The comparison is made once per new stamp value: while the refetch of the user data is in
 * flight, replies that carry the same new stamp do nothing. Guests get no stamp and nothing
 * happens. The client never decides what the change means: it only notices that it happened.
 */
import type { QueryClient } from '@tanstack/react-query';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { getQueryClient } from '../providers/query-client';
import type { IUserDataResponse } from '../types/auth/jwt-payload.types';

/** Response header carrying the caller's access stamp. */
export const ACL_STAMP_HEADER = 'x-acl-stamp';

/** The stamp whose mismatch already invalidated the user data (so it is not repeated). */
let lastInvalidatedStamp: string | null = null;

/**
 * Compare a reply's stamp with the user data in the cache; invalidate the user data when they
 * differ and this stamp has not caused an invalidation yet.
 *
 * Does nothing when the reply has no stamp, when no user data (or no `acl_stamp` in it, an
 * older core) is cached to compare with, or when they are equal.
 */
export function observeAclStamp(queryClient: QueryClient, stamp: string | null | undefined): void {
    if (!stamp) {
        return;
    }
    const cached = queryClient.getQueryData<IUserDataResponse>(REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA)
        ?.data?.acl_stamp;
    if (!cached) {
        return;
    }
    if (cached === stamp) {
        lastInvalidatedStamp = null;
        return;
    }
    if (lastInvalidatedStamp === stamp) {
        return;
    }
    lastInvalidatedStamp = stamp;
    void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA });
}

/** Read the stamp from response headers (Axios `AxiosHeaders`, a plain object, or `Headers`). */
export function readAclStamp(headers: unknown): string | null {
    if (!headers || typeof headers !== 'object') {
        return null;
    }
    const source = headers as { get?: (name: string) => unknown } & Record<string, unknown>;
    const value = typeof source.get === 'function' ? source.get(ACL_STAMP_HEADER) : source[ACL_STAMP_HEADER];
    return typeof value === 'string' && value !== '' ? value : null;
}

/** Called by the API client for every reply, success or error. Browser only. */
export function observeAclStampHeader(headers: unknown): void {
    if (typeof window === 'undefined') {
        return;
    }
    observeAclStamp(getQueryClient(), readAclStamp(headers));
}

/** Forget what was invalidated (tests only). */
export function resetAclStampForTests(): void {
    lastInvalidatedStamp = null;
}
