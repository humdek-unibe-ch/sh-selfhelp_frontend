/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../renderWithProviders';
import { server } from '../msw/server';
import { apiEnvelope } from '../msw/createHandlers';

describe('renderWithProviders (test harness)', () => {
    it('mounts a component inside Mantine + React Query providers', () => {
        renderWithProviders(<div>hello-harness</div>);
        expect(screen.getByText('hello-harness')).toBeInTheDocument();
    });

    it('exposes the QueryClient used for the render', () => {
        const { queryClient } = renderWithProviders(<span>x</span>);
        expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
    });
});

describe('MSW harness', () => {
    it('serves a backend-shaped envelope from a per-test handler', async () => {
        server.use(
            http.get('*/cms-api/v1/qa-ping', () => HttpResponse.json(apiEnvelope({ pong: true }))),
        );
        const res = await fetch('https://backend.test/cms-api/v1/qa-ping');
        const body = (await res.json()) as { status: number; error: null | string; data: { pong: boolean } };
        expect(res.status).toBe(200);
        expect(body.status).toBe(200);
        expect(body.error).toBeNull();
        expect(body.data).toEqual({ pong: true });
    });
});
