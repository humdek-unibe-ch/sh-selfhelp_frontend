/**
 * @fileoverview Profile component that handles user authentication state and profile menu
 * in the application header. Provides user information display and logout functionality.
 */

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
import { jwtDecode, JwtPayload } from "jwt-decode";

/**
 * Interface for decoded JWT token with user information
 */
interface UserToken extends JwtPayload {
  sub?: string;  // User ID
}

/**
 * Profile component displays user information and authentication controls.
 * Features a dropdown menu with user details and logout functionality.
 * 
 * Features:
 * - User avatar display
 * - Profile dropdown menu
 * - User information display
 * - Logout functionality
 * - JWT token handling
 * 
 * @component
 * @example
 * return (
 *   <Header>
 *     <Profile />
 *   </Header>
 * )
 */
const Profile = () => {
  // State for managing the profile menu anchor element
  const [anchorEl2, setAnchorEl2] = useState<HTMLElement | null>(null);
  
  // Authentication hooks and context
  const { accessToken } = useAuthContext();
  const { logout } = useAuth();

  // Decode JWT token to get user information
  const decodedToken = accessToken ? jwtDecode<UserToken>(accessToken) : null;

  /**
   * Handles opening the profile menu
   * @param event - Click event from the profile button
   */
  const handleClick2 = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl2(event.currentTarget);
  };

  /**
   * Handles closing the profile menu
   */
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  /**
   * Handles user logout process
   * Closes the menu and calls the logout function from useAuth hook
   */
  const handleLogout = async () => {
    try {
      handleClose2();
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Box>
      {/* Profile Avatar Button */}
      <IconButton
        size="large"
        aria-label="profile menu"
        color="inherit"
        aria-controls="profile-menu"
        aria-haspopup="true"
        sx={{
          ...(Boolean(anchorEl2) && {
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

      {/* Profile Dropdown Menu */}
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
        {/* User Information Section */}
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

        {/* Logout Button Section */}
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
