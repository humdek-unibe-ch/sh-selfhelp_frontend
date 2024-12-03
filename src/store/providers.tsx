/**
 * @fileoverview Root provider component that wraps the application with all necessary providers
 * in the correct order. This includes state management, theming, caching, and authentication.
 */

"use client";
import { ReactNode } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store";
import { ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeSettings } from "@/utils/theme/Theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageContentProvider } from '@/contexts/PageContentContext';
import RTL from "@/app/admin/layout/shared/customizer/RTL";
import CssBaseline from "@mui/material/CssBaseline";

/**
 * QueryClient configuration for React Query
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Inner providers that require Redux context
 */
const InnerProviders = ({ children }: ProvidersProps) => {
  const theme = ThemeSettings();

  return (
    <ThemeProvider theme={theme}>
      <RTL>
        <CssBaseline />
        <AuthProvider>
          <PageContentProvider>
            {children}
          </PageContentProvider>
        </AuthProvider>
      </RTL>
    </ThemeProvider>
  );
};

/**
 * Root Providers component that wraps the application with all necessary providers.
 * Providers are ordered based on dependencies and best practices:
 * 1. Redux Store (base state management)
 * 2. Redux Persist (persistence layer)
 * 3. Router Cache (Next.js routing optimization)
 * 4. React Query (server state management)
 * 5. Theme Provider (MUI theming)
 * 6. RTL Support (right-to-left text support)
 * 7. Auth Provider (authentication state)
 * 8. Page Content Provider (content management)
 * 
 * @component
 * @param {ProvidersProps} props - Component props
 * @returns {JSX.Element} Provider-wrapped application
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <QueryClientProvider client={queryClient}>
            <InnerProviders>
              {children}
            </InnerProviders>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </AppRouterCacheProvider>
      </PersistGate>
    </Provider>
  );
}
