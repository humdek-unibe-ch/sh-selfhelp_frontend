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
    justifyContent: "space-between",
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
    // Media query hooks for responsive design
    const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));
    const lgDown = useMediaQuery((theme: any) => theme.breakpoints.down("lg"));
    
    // State for mobile navigation drawer
    const [open, setOpen] = React.useState(false);

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
            <Container maxWidth="lg">
                <ToolbarStyled>
                    <AuthLogo />
                    {/* Mobile view */}
                    {lgDown ? (
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
                    ) : null}
                    {/* Desktop view */}
                    {lgUp ? (
                        <>
                            <Stack spacing={1} direction="row" alignItems="center">
                                <Navigations />
                            </Stack>
                            <SystemControls />
                        </>
                    ) : null}
                </ToolbarStyled>
            </Container>
            {/* Mobile navigation drawer */}
            <Drawer
                anchor="left"
                open={open}
                variant="temporary"
                onClose={toggleDrawer(false)}
                PaperProps={{
                    sx: {
                        width: 270,
                        border: "0 !important",
                        boxShadow: (theme) => theme.shadows[8],
                    },
                }}
            >
                <MobileSidebar />
            </Drawer>
        </AppBarStyled>
    );
};

export default HpHeader;
