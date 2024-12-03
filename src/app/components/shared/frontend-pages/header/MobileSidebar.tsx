"use client";
import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { Chip } from "@mui/material";
import Logo from "@/app/admin/layout/shared/logo/Logo";
import { useNavigation } from "@/hooks/useNavigation";

const MobileSidebar = () => {
    const { menuItems } = useNavigation();
    return (
        <>
            <Box px={3}>
                <Logo />
            </Box>
            <Box p={3}>
                <Stack direction="column" spacing={2}>
                    {menuItems.map((navlink, i) => (
                        <Button
                            color="inherit"
                            href={navlink.href}
                            key={i}
                            sx={{
                                justifyContent: "start",
                            }}
                        >
                            {navlink.title}{" "}
                            {navlink.new ? (
                                <Chip
                                    label="New"
                                    size="small"
                                    sx={{
                                        ml: "6px",
                                        borderRadius: "8px",
                                        color: "primary.main",
                                        backgroundColor: "rgba(93, 135, 255, 0.15)",
                                    }}
                                />
                            ) : null}
                        </Button>
                    ))}
                </Stack>
            </Box>
        </>
    );
};

export default MobileSidebar;
