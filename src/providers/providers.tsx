'use client';

// Setup why-did-you-render in development
if (process.env.NODE_ENV === 'development') {
    const whyDidYouRender = require('@welldone-software/why-did-you-render');
    const React = require('react');

    // Custom notifier to capture WDYR logs in our debug system
    const wdyrNotifier = ({
        Component,
        displayName,
        hookName,
        prevProps,
        prevState,
        prevHookResult,
        nextProps,
        nextState,
        nextHookResult,
        reason,
        options,
        ownerDataMap
    }) => {
        const componentName = displayName || Component?.name || 'Unknown';

        // Log to our debug system
        if (typeof window !== 'undefined' && (window as any).captureDebug) {
            (window as any).captureDebug(
                `[why-did-you-render] ${componentName} re-rendered unnecessarily`,
                componentName,
                {
                    reason,
                    prevProps,
                    nextProps,
                    prevState,
                    nextState,
                    hookName,
                    prevHookResult,
                    nextHookResult,
                    ownerDataMap
                },
                'info'
            );
        }

        // Default WDYR console logging
        console.group(`[why-did-you-render] ${componentName}`);
        console.log('Reason:', reason);
        if (prevProps && nextProps) {
            console.log('Props changed:', { prev: prevProps, next: nextProps });
        }
        if (prevState && nextState) {
            console.log('State changed:', { prev: prevState, next: nextState });
        }
        if (hookName) {
            console.log('Hook changed:', hookName, { prev: prevHookResult, next: nextHookResult });
        }
        console.groupEnd();
    };

    whyDidYouRender(React, {
        trackAllPureComponents: true,
        collapseGroups: true,
        logOnDifferentValues: true,
        include: [/SectionInspector/, /PageInspector/], // Only track key components
        exclude: [/@mantine/, /Notifications/, /DebugMenu/], // Exclude UI libraries
        notifier: wdyrNotifier, // Use custom notifier to capture logs
    });
}

import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Refine } from '@refinedev/core';
import appRouter from '@refinedev/nextjs-router';
import dataProvider from '@refinedev/simple-rest';
import { API_CONFIG } from '../config/api.config';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAppNavigation } from '../hooks/useAppNavigation';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authProvider } from './auth.provider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LoadingScreen } from '../app/components/shared/common/LoadingScreen';
import { LanguageProvider } from '../app/components/contexts/LanguageContext';
import { EnhancedLanguageProvider } from '../app/components/contexts/EnhancedLanguageProvider';
import { theme } from '../../theme';

// Create a client with global configuration settings WITHOUT persistence
// This eliminates stale data issues while maintaining performance
const queryClient = new QueryClient({
    defaultOptions: REACT_QUERY_CONFIG.DEFAULT_OPTIONS,
});

function RefineWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const { resources, isLoading } = useAppNavigation({ isAdmin });

    // Don't prefetch navigation automatically to avoid unnecessary API calls
    // Navigation will be loaded on demand for better performance

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Refine
            routerProvider={appRouter}
            dataProvider={dataProvider(API_CONFIG.BASE_URL)}
            authProvider={authProvider}
            resources={resources}
            options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                disableTelemetry: true,
            }}
        >
            <EnhancedLanguageProvider>
                {children}
            </EnhancedLanguageProvider>
        </Refine>
    );
}

function Providers({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    if (!isReady) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider
                defaultColorScheme="auto"
                theme={theme}
            >
                <Notifications />
                <LanguageProvider>
                    <RefineWrapper>
                        {children}
                    </RefineWrapper>
                </LanguageProvider>
            </MantineProvider>
            <ReactQueryDevtools
                initialIsOpen={false}
                buttonPosition="bottom-right"
            />
        </QueryClientProvider>
    );
}

export { Providers };
