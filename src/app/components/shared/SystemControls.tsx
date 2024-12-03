"use client";
import { Stack, Button } from "@mui/material";
import Language from "../../admin/layout/vertical/header/Language";
import DarkLightMode from "../../admin/layout/vertical/header/DarkLightMode";
import Profile from "../../admin/layout/vertical/header/Profile";
import { useAuthContext } from "@/contexts/AuthContext";

const SystemControls = () => {
    const { isAuthenticated } = useAuthContext();

    return (
        <Stack spacing={1} direction="row" alignItems="center">
            <Language />
            <DarkLightMode />
            {isAuthenticated ? (
                <Profile />
            ) : (
                <Button color="secondary" variant="contained" href="/auth/auth1/login">
                    Login
                </Button>
            )}
        </Stack>
    );
};

export default SystemControls;