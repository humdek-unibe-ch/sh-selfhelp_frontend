import * as React from "react";
import {
    IconButton,
    Box,
    AppBar,
    useMediaQuery,
    Toolbar,
    styled,
    Theme,
} from "@mui/material";

import { useSelector, useDispatch } from "@/store/hooks";
import { toggleMobileSidebar } from "@/store/customizer/CustomizerSlice";
import { IconMenu2 } from "@tabler/icons-react";
import Search from "../../vertical/header/Search";
import Logo from "../../shared/logo/Logo";
import { AppState } from "@/store/store";
import SystemControls from "../../shared/SystemControls";

const Header = () => {
    const lgDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("lg"));
    const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

    // drawer
    const customizer = useSelector((state: AppState) => state.customizer);
    const dispatch = useDispatch();

    const AppBarStyled = styled(AppBar)(({ theme }) => ({
        boxShadow:
            "0 3px 5px -1px rgba(0, 0, 0, .2),0 5px 8px 0 rgba(0, 0, 0, .14),0 1px 14px 0 rgba(0, 0, 0, .12)!important",
        background: theme.palette.primary.main,
        justifyContent: "center",
        backdropFilter: "blur(4px)",

        [theme.breakpoints.up("lg")]: {
            minHeight: customizer.TopbarHeight,
        },
    }));
    const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
        width: "100%",
        color: theme.palette.warning.contrastText,
        margin: "0 auto"
    }));

    return (
        <AppBarStyled position="sticky" color="default">
            <ToolbarStyled
                sx={{
                    maxWidth: customizer.isLayout === "boxed" ? "lg" : "100%!important",
                }}
            >
                <Box sx={{ width: lgDown ? "40px" : "auto", overflow: "hidden" }}>
                    <Logo />
                </Box>
                {/* ------------------------------------------- */}
                {/* Toggle Button Sidebar */}
                {/* ------------------------------------------- */}
                {lgDown ? (
                    <IconButton
                        color="inherit"
                        aria-label="menu"
                        onClick={() => dispatch(toggleMobileSidebar())}
                    >
                        <IconMenu2 />
                    </IconButton>
                ) : (
                    ""
                )}
                {/* ------------------------------------------- */}
                {/* Search Dropdown */}
                {/* ------------------------------------------- */}
                <Search />

                <Box flexGrow={1} />
                <SystemControls isLoggedIn={false} /> {/* Set isLoggedIn based on your auth state */}
            </ToolbarStyled>
        </AppBarStyled>
    );
};

export default Header;
