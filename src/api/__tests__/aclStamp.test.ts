/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
    observeAclStamp,
    readAclStamp,
    resetAclStampForTests,
} from '../../utils/acl-stamp.utils';

let client: QueryClient;
let invalidate: MockInstance<QueryClient['invalidateQueries']>;

function cacheUserData(stamp: string | null | undefined): void {
    client.setQueryData(['user-data'], { data: { id: 7, acl_stamp: stamp } });
}

beforeEach(() => {
    resetAclStampForTests();
    client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    invalidate = vi.spyOn(client, 'invalidateQueries');
});

afterEach(() => {
    client.clear();
});

describe('access stamp (C5)', () => {
    it('a reply with a different stamp invalidates user data, once per new value (P4-A3)', () => {
        cacheUserData('aaaaaaaaaaaaaaaa');

        observeAclStamp(client, 'bbbbbbbbbbbbbbbb');
        observeAclStamp(client, 'bbbbbbbbbbbbbbbb');
        observeAclStamp(client, 'bbbbbbbbbbbbbbbb');

        expect(invalidate).toHaveBeenCalledTimes(1);
        expect(invalidate).toHaveBeenCalledWith({ queryKey: ['user-data'] });
    });

    it('a stamp equal to the one in user data does nothing (P4-A3)', () => {
        cacheUserData('aaaaaaaaaaaaaaaa');

        observeAclStamp(client, 'aaaaaaaaaaaaaaaa');

        expect(invalidate).not.toHaveBeenCalled();
    });

    it('invalidates again for a stamp that differs later, after the user data caught up', () => {
        cacheUserData('aaaaaaaaaaaaaaaa');
        observeAclStamp(client, 'bbbbbbbbbbbbbbbb');
        expect(invalidate).toHaveBeenCalledTimes(1);

        // The refetch of the user data landed with the new stamp.
        cacheUserData('bbbbbbbbbbbbbbbb');
        observeAclStamp(client, 'bbbbbbbbbbbbbbbb');
        observeAclStamp(client, 'cccccccccccccccc');

        expect(invalidate).toHaveBeenCalledTimes(2);
    });

    it('does nothing without a stamp (a guest), without user data, or with user data from an older core', () => {
        observeAclStamp(client, null);
        observeAclStamp(client, undefined);
        observeAclStamp(client, 'bbbbbbbbbbbbbbbb');
        cacheUserData(undefined);
        observeAclStamp(client, 'bbbbbbbbbbbbbbbb');
        cacheUserData(null);
        observeAclStamp(client, 'bbbbbbbbbbbbbbbb');

        expect(invalidate).not.toHaveBeenCalled();
    });

    it('reads the header from Axios headers, a plain object and Headers', () => {
        expect(readAclStamp({ 'x-acl-stamp': 'abc' })).toBe('abc');
        expect(readAclStamp({ get: (name: string) => (name === 'x-acl-stamp' ? 'def' : undefined) })).toBe('def');
        expect(readAclStamp(new Headers({ 'X-Acl-Stamp': 'ghi' }))).toBe('ghi');
        expect(readAclStamp({})).toBeNull();
        expect(readAclStamp(undefined)).toBeNull();
    });
});
