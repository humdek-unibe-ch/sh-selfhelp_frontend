'use client';

import "../../globals.css";
import "@mantine/core/styles.css";
import { MantineProvider, AppShell } from "@mantine/core";
import { WebsiteHeader } from "../components/website/WebsiteHeader";
import { WebsiteFooter } from "../components/website/WebsiteFooter";
import { theme } from "../../../theme";

export default function RootLayout({ children }: { children: any }) {

    return (
        <MantineProvider theme={theme}>
            <AppShell
                header={{ height: 60 }}
                footer={{ height: 'auto' }}
            >
                <AppShell.Header>
                    <WebsiteHeader />
                </AppShell.Header>
                
                <AppShell.Main>
                    {children}
                </AppShell.Main>
                
                <AppShell.Footer>
                    <WebsiteFooter />
                </AppShell.Footer>
            </AppShell>
        </MantineProvider>
    );
}
