/**
 * @fileoverview Frontend header component that provides navigation, system controls,
 * and responsive layout for both desktop and mobile views.
 */

"use client";
import React from "react";
import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import { IconMenu2 } from "@tabler/icons-react";
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";

// Custom components
import Navigations from "./Navigations";
import MobileSidebar from "./MobileSidebar";
import AuthLogo from "@/app/admin/layout/shared/logo/AuthLogo";
import SystemControls from "@/app/components/shared/SystemControls";

/**
 * Styled AppBar component with responsive height and custom background
 */
const AppBarStyled = styled(AppBar)(({ theme }) => ({
    justifyContent: "center",
    [theme.breakpoints.up("lg")]: {
        minHeight: "100px",
    },
    backgroundColor: theme.palette.primary.light,
}));

/**
 * Styled Toolbar component with custom spacing and layout
 */
const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: "100%",
    paddingLeft: "0 !important",
    paddingRight: "0 !important",
    color: theme.palette.text.secondary,
}));

/**
 * Frontend header component that provides navigation and system controls.
 * Includes responsive design for both desktop and mobile views.
 * 
 * Features:
 * - Responsive layout with different views for desktop and mobile
 * - System controls (language, theme, authentication)
 * - Mobile navigation drawer
 * - Company logo
 * 
 * @component
 */
const HpHeader = (props: any) => {
    const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));
    const lgDown = useMediaQuery((theme: any) => theme.breakpoints.down("lg"));
    const [open, setOpen] = React.useState(false);
    const customizer = useSelector((state: AppState) => state.customizer);

    /**
     * Opens the mobile navigation drawer
     */
    const handleDrawerOpen = () => {
        setOpen(true);
    };

    /**
     * Toggles the mobile navigation drawer
     * @param newOpen - The new state for the drawer
     */
    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };

    return (
        <AppBarStyled position="sticky" elevation={0}>
            <Container 
                sx={{
                    maxWidth: customizer.isLayout === "boxed" ? "lg" : "100%!important",
                }}
            >
                <ToolbarStyled>
                    {/* Desktop view */}
                    {!lgDown ? (
                        <Stack 
                            direction="row" 
                            spacing={2} 
                            alignItems="center" 
                            sx={{ 
                                width: '100%',
                                justifyContent: 'space-between'
                            }}
                        >
                            <Stack 
                                direction="row" 
                                spacing={4} 
                                alignItems="center"
                            >
                                <AuthLogo />
                                <Navigations />
                            </Stack>
                            <SystemControls />
                        </Stack>
                    ) : (
                        // Mobile view
                        <Stack 
                            direction="row" 
                            alignItems="center" 
                            justifyContent="space-between" 
                            sx={{ width: '100%' }}
                        >
                            <AuthLogo />
                            <Box display="flex" gap={1}>
                                <SystemControls />
                                <IconButton
                                    color="inherit"
                                    aria-label="menu"
                                    onClick={handleDrawerOpen}
                                >
                                    <IconMenu2 size="20" />
                                </IconButton>
                            </Box>
                            <Drawer
                                anchor="right"
                                open={open}
                                onClose={toggleDrawer(false)}
                                sx={{
                                    '& .MuiDrawer-paper': {
                                        width: '280px',
                                        background: (theme) => theme.palette.background.paper,
                                        color: (theme) => theme.palette.text.primary,
                                        borderRadius: '0',
                                        borderRight: '0',
                                    },
                                }}
                            >
                                <MobileSidebar />
                            </Drawer>
                        </Stack>
                    )}
                </ToolbarStyled>
            </Container>
        </AppBarStyled>
    );
};

export default HpHeader;
