"use client";
import React from "react";
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";
import { useNavigation } from "@/hooks/useNavigation";
import HpHeader from "../components/shared/frontend-pages/header/HpHeader";
import Customizer from "../admin/layout/shared/customizer/Customizer";
import Footer from "../components/shared/frontend-pages/footer";
import ScrollToTop from "../components/shared/frontend-pages/scroll-to-top";
import { Box, Container, useMantineTheme } from "@mantine/core";

interface Props {
    children: React.ReactNode;
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { routes: routes, isLoading } = useNavigation();
    const customizer = useSelector((state: AppState) => state.customizer);
    const theme = useMantineTheme();

    if (isLoading) return <div>Loading...</div>;

    return (
        <Box>
            <title>SelfHelp</title>
            <HpHeader />

            <Box
                style={{
                    display: "flex",
                    flexGrow: 1,
                    paddingBottom: "60px",
                    flexDirection: "column",
                    zIndex: 1,
                    backgroundColor: "transparent",
                    marginLeft: customizer.isHorizontal ? 0 : 
                        customizer.isCollapse ? `${customizer.MiniSidebarWidth}px` : 
                        `${customizer.SidebarWidth}px`
                }}
            >
                <Container
                    size={customizer.isLayout === "boxed" ? "lg" : "100%"}
                >
                    <Box style={{ minHeight: "calc(100vh - 170px)" }}>{children}</Box>
                </Container>
                <Customizer />
            </Box>
            <Footer />
        </Box>
    );
}
