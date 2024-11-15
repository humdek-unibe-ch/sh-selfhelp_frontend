"use client";
import { styled, Container, Box, useTheme } from "@mui/material";
import React from "react";
import Header from "./layout/vertical/header/Header";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Customizer from "./layout/shared/customizer/Customizer";
import Navigation from "./layout/horizontal/navbar/Navigation";
import HorizontalHeader from "./layout/horizontal/header/Header";
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";
import { useRoutes } from '@/hooks/useRoutes';

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
   const { data: routes, isLoading } = useRoutes();
   const customizer = useSelector((state: AppState) => state.customizer);
   const theme = useTheme();

   if (isLoading) return <div>Loading...</div>;

   return (
      <MainWrapper>
         <title>SelfHelp</title>
         {customizer.isHorizontal ? "" : <Header />}
         {customizer.isHorizontal ? "" : <Sidebar />}
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
            {customizer.isHorizontal ? <HorizontalHeader /> : ""}
            {customizer.isHorizontal ? <Navigation /> : ""}
            <Container
               sx={{
                  maxWidth: customizer.isLayout === "boxed" ? "lg" : "100%!important",
               }}
            >
               <Box sx={{ minHeight: "calc(100vh - 170px)" }}>{children}</Box>
            </Container>
            <Customizer />
         </PageWrapper>
      </MainWrapper>
   );
}
