"use client";
import React, { useState } from "react";
import {
  Box,
  Menu,
  Avatar,
  Typography,
  Divider,
  Button,
  IconButton,
} from "@mui/material";
import { Stack } from "@mui/system";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { jwtDecode , JwtPayload } from "jwt-decode";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const { accessToken } = useAuthContext();
  const { logout } = useAuth();
  
  const decodedToken = accessToken ? jwtDecode<JwtPayload>(accessToken) : null;

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleLogout = () => {
    handleClose2();
    logout();
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="profile menu"
        color="inherit"
        aria-controls="profile-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === "object" && {
            color: "primary.main",
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src={"/images/profile/user2.jpg"}
          alt="User"
          sx={{
            width: 35,
            height: 35,
          }}
        />
      </IconButton>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "300px",
          },
        }}
      >
        <Box p={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={"/images/profile/user2.jpg"}
              alt="User"
              sx={{ width: 64, height: 64 }}
            />
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                User ID: {decodedToken?.sub || 'Unknown'}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Divider />
        <Box p={2}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
