import { Stack, Button } from "@mui/material";
import Language from "../vertical/header/Language";
import DarkLightMode from "../vertical/header/DarkLightMode";
import Profile from "../vertical/header/Profile";

interface SystemControlsProps {
    isLoggedIn?: boolean;
}

const SystemControls = ({ isLoggedIn = false }: SystemControlsProps) => {
    return (
        <Stack spacing={1} direction="row" alignItems="center">
            <Language />
            <DarkLightMode />
            {isLoggedIn ? (
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