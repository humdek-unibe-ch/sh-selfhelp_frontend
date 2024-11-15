"use client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import RTL from "@/app/(DashboardLayout)/layout/shared/customizer/RTL";
import { ThemeSettings } from "@/utils/theme/Theme";
import { useSelector } from 'react-redux';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { AppState } from "@/store/store"; // Changed AppState to RootState
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import "@/utils/i18n";
import "@/app/api/index";

const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
         retry: 2,
         refetchOnWindowFocus: false,
      },
   },
});

const MyApp = ({ children }: { children: React.ReactNode }) => {
   const theme = ThemeSettings();
   const customizer = useSelector((state: AppState) => state.customizer);

   return (
      <QueryClientProvider client={queryClient}>
         <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <ThemeProvider theme={theme}>
               <RTL direction={customizer.activeDir}>
                  <CssBaseline />
                  {children}
               </RTL>
            </ThemeProvider>
         </AppRouterCacheProvider>
         <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
   );
};

export default MyApp;
