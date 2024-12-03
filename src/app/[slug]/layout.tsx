"use client";
import { styled, Container, Box, useTheme } from "@mui/material";
import React from "react";
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";
import { useNavigation } from "@/hooks/useNavigation";
import HpHeader from "../components/shared/frontend-pages/header/HpHeader";
import Customizer from "../admin/layout/shared/customizer/Customizer";
import Footer from "../components/shared/frontend-pages/footer";
import ScrollToTop from "../components/shared/frontend-pages/scroll-to-top";

const MainWrapper = styled("div")(() => ({
}));

const PageWrapper = styled("div")(() => ({
    display: "flex",
    flexGrow: 1,
    paddingBottom: "60px",
    flexDirection: "column",
    zIndex: 1,
    backgroundColor: "transparent",
}));

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
    const theme = useTheme();

    if (isLoading) return <div>Loading...</div>;

    return (
        <MainWrapper>
            <title>SelfHelp</title>
            {/* {customizer.isHorizontal ? "" : <Header />}
         {customizer.isHorizontal ? "" : <Sidebar />} */}
            <HpHeader />

            <PageWrapper
                className="page-wrapper"
                sx={{
                    ...(customizer.isHorizontal == false && {
                        [theme.breakpoints.up("lg")]: {
                            ml: `${customizer.SidebarWidth}px`,
                        },
                    }),
                    ...(customizer.isCollapse && {
                        [theme.breakpoints.up("lg")]: {
                            ml: `${customizer.MiniSidebarWidth}px`,
                        },
                    }),
                }}
            >
                {/* {customizer.isHorizontal ? <HorizontalHeader /> : ""}
            {customizer.isHorizontal ? <Navigation /> : ""} */}
                <Container
                    sx={{
                        maxWidth: customizer.isLayout === "boxed" ? "lg" : "100%!important",
                    }}
                >
                    <Box sx={{ minHeight: "calc(100vh - 170px)" }}>{children}</Box>
                </Container>
                <Customizer />
            </PageWrapper>
            <Footer />
            {/* <ScrollToTop /> */}
        </MainWrapper>
    );
}
