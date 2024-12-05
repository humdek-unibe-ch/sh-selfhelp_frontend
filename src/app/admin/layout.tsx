"use client";
import React from "react";
import Header from "./layout/vertical/header/Header";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Customizer from "./layout/shared/customizer/Customizer";
import Navigation from "./layout/horizontal/navbar/Navigation";
import HorizontalHeader from "./layout/horizontal/header/Header";
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";
import { useNavigation } from "@/hooks/useNavigation";
import { Box, Container, useMantineTheme } from "@mantine/core";

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
         {customizer.isHorizontal ? "" : <Header />}
         {customizer.isHorizontal ? "" : <Sidebar />}
         <Box
            className="page-wrapper"
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
            {customizer.isHorizontal ? <HorizontalHeader /> : ""}
            {customizer.isHorizontal ? <Navigation /> : ""}
            <Container
               size={customizer.isLayout === "boxed" ? "lg" : "100%"}
            >
               <Box style={{ minHeight: "calc(100vh - 170px)" }}>{children}</Box>
            </Container>
            <Customizer />
         </Box>
      </Box>
   );
}
