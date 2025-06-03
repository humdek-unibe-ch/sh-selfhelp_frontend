'use client';

import "../../globals.css";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { WebsiteHeader } from "../components/website/WebsiteHeader";
import { WebsiteFooter } from "../components/website/WebsiteFooter";
import { theme } from "../../../theme";

export default function RootLayout({ children }: { children: any }) {

    return (
        <MantineProvider theme={theme}>
            <div className="min-h-screen flex flex-col">
                <WebsiteHeader />   
                <main className="flex-1">{children}</main>
                <WebsiteFooter />
            </div>
        </MantineProvider>
    );
}
