/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `renderWithProviders` — render a component inside the providers the app
 * relies on (Mantine theme + React Query). Use this instead of RTL's bare
 * `render` so component/hook tests behave like the real app.
 *
 * The QueryClient disables retries and caching so tests are deterministic and
 * order-independent (canonical Testing Rule 14).
 */
import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0, staleTime: 0 },
            mutations: { retry: false },
        },
    });
}

interface IProvidersProps {
    children: ReactNode;
    queryClient: QueryClient;
}

function AllProviders({ children, queryClient }: IProvidersProps): ReactElement {
    return (
        <MantineProvider>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </MantineProvider>
    );
}

export interface IRenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
    queryClient?: QueryClient;
}

export function renderWithProviders(ui: ReactElement, options: IRenderWithProvidersOptions = {}) {
    const { queryClient = createTestQueryClient(), ...rest } = options;
    const result = render(ui, {
        wrapper: ({ children }) => <AllProviders queryClient={queryClient}>{children}</AllProviders>,
        ...rest,
    });
    return { queryClient, ...result };
}
