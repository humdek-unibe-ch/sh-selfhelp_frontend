'use client';

import "../../globals.css";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { WebsiteHeader } from "../components/website/WebsiteHeader";
import { theme } from "../../../theme";

export default function RootLayout({ children }: { children: any }) {

    return (
        <MantineProvider theme={theme}>
            <WebsiteHeader />   
            <main>{children}</main>
        </MantineProvider>
    );
}
