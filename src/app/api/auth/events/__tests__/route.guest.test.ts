/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The Mercure subscription route serves a visitor without a session (C4): the bootstrap goes
 * out without an Authorization header, and the hub URL carries the public sync topic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const cookieValues = vi.hoisted(() => ({ values: {} as Record<string, string> }));

vi.mock('next/headers', () => ({
    cookies: async () => ({
        get: (name: string) => (name in cookieValues.values ? { name, value: cookieValues.values[name] } : undefined),
    }),
}));

import { GET } from '../route';
import { AUTH_COOKIE } from '../../../../../config/server.config';

const PUBLIC_TOPIC = 'urn:selfhelp:sync:public';

function hubStream(): Response {
    return new Response(new ReadableStream({ start: (controller) => controller.enqueue(new TextEncoder().encode(': hi\n\n')) }), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
    });
}

function bootstrapJson(body: Record<string, unknown>): Response {
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

const fetchMock = vi.fn();

beforeEach(() => {
    cookieValues.values = {};
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

function request(): NextRequest {
    return new NextRequest('http://localhost:3000/api/auth/events');
}

describe('GET /api/auth/events for a guest (P4-A5)', () => {
    it('asks the backend without a token and subscribes to the public topic only', async () => {
        fetchMock
            .mockResolvedValueOnce(
                bootstrapJson({
                    hubUrl: 'http://hub.test/.well-known/mercure',
                    topic: null,
                    impersonationTopic: null,
                    systemUpdateTopic: null,
                    syncTopics: [PUBLIC_TOPIC],
                    token: 'subscriber-jwt',
                    expiresIn: 3600,
                }),
            )
            .mockResolvedValueOnce(hubStream());

        const res = await GET(request());

        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/event-stream');

        const [bootstrapUrl, bootstrapInit] = fetchMock.mock.calls[0];
        expect(String(bootstrapUrl)).toContain('/auth/events');
        expect((bootstrapInit.headers as Record<string, string>).Authorization).toBeUndefined();

        const [hubUrl, hubInit] = fetchMock.mock.calls[1];
        expect(String(hubUrl)).toBe(`http://hub.test/.well-known/mercure?topic=${encodeURIComponent(PUBLIC_TOPIC)}`);
        expect((hubInit.headers as Record<string, string>).Authorization).toBe('Bearer subscriber-jwt');
    });

    it('a signed-in user sends the token and subscribes to the personal and the sync topics once each', async () => {
        cookieValues.values[AUTH_COOKIE] = 'session-jwt';
        fetchMock
            .mockResolvedValueOnce(
                bootstrapJson({
                    hubUrl: 'http://hub.test/.well-known/mercure',
                    topic: 'urn:acl:7',
                    impersonationTopic: 'urn:imp:7',
                    systemUpdateTopic: 'urn:sys:7',
                    syncTopics: ['urn:sync:user:7', 'urn:sync:group:3', PUBLIC_TOPIC, 'urn:sync:group:3'],
                    token: 'subscriber-jwt',
                    expiresIn: 3600,
                }),
            )
            .mockResolvedValueOnce(hubStream());

        const res = await GET(request());

        expect(res.status).toBe(200);
        const bootstrapInit = fetchMock.mock.calls[0][1];
        expect((bootstrapInit.headers as Record<string, string>).Authorization).toBe('Bearer session-jwt');

        const topics = new URL(String(fetchMock.mock.calls[1][0])).searchParams.getAll('topic');
        expect(topics).toEqual(['urn:acl:7', 'urn:imp:7', 'urn:sys:7', 'urn:sync:user:7', 'urn:sync:group:3', PUBLIC_TOPIC]);
    });

    it('a backend that predates live sync still streams a user\'s personal topic', async () => {
        cookieValues.values[AUTH_COOKIE] = 'session-jwt';
        fetchMock
            .mockResolvedValueOnce(
                bootstrapJson({ hubUrl: 'http://hub.test/.well-known/mercure', topic: 'urn:acl:7', token: 't' }),
            )
            .mockResolvedValueOnce(hubStream());

        const res = await GET(request());

        expect(res.status).toBe(200);
        expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.getAll('topic')).toEqual(['urn:acl:7']);
    });

    it('answers 502 when the bootstrap names no topic at all', async () => {
        fetchMock.mockResolvedValueOnce(
            bootstrapJson({ hubUrl: 'http://hub.test/.well-known/mercure', topic: null, syncTopics: [], token: 't' }),
        );

        const res = await GET(request());

        expect(res.status).toBe(502);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('passes the status of a failing bootstrap on, so the browser closes the stream', async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

        const res = await GET(request());

        expect(res.status).toBe(401);
    });
});
