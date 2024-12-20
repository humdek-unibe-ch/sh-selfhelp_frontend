'use client';

import "../globals.css";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "../../theme";
import { WebsiteHeader } from "../components/website/WebsiteHeader";

export default function RootLayout({ children }: { children: any }) {

    return (
        <MantineProvider theme={theme}>
            <WebsiteHeader />
            <main>{children}</main>
        </MantineProvider>
    );
}
