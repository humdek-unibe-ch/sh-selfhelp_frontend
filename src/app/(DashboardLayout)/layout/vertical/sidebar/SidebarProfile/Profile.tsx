"use client"

import { Box, Avatar, Typography, useMediaQuery,Tooltip, IconButton, Button,
 } from "@mui/material";
 import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useSelector } from "@/store/hooks";
import { AppState } from "@/store/store";
import { styled } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import {
  IconCaretDownFilled,
  IconUser,
  IconNote,
  IconMail,
  IconLogout,
  IconSettings,
} from "@tabler/icons-react";
import Link from 'next/link';
import { useState } from "react";

const StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'center',
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 200,
    color:
      theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenuItem-root': {
       gap:"6px",
       alignItems:"center",
       padding:"8px 16px",
       '&:hover': {
        backgroundColor: theme.palette.primary.light,
      },
    },
  },
}));

export const Profile = () => {
  const customizer = useSelector((state: AppState) => state.customizer);
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));
  const hideMenu = lgUp
    ? customizer.isCollapse && !customizer.isSidebarHover
    : "";

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: any) => {
      setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
      setAnchorEl(null);
    };

  return (
    <Box
      sx={{
        backgroundImage: `url('/images/backgrounds/sidebar-profile-bg.jpg')`,
        borderRadius: "0 !important",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top center",
      }}
    >
      <>
        <Box px="12px" py="28px" borderRadius="0 !important">
          <Avatar
            alt="Remy Sharp"
            src={"/images/profile/user2.jpg"}
            sx={{ height: 50, width: 50 }}
          />
        </Box>
        <IconButton
                  aria-expanded={open ? "true" : undefined}
                  aria-haspopup="true"
                  onClick={handleClick}
                  size="small"
                  aria-label="action"
                  sx={{p:0,width:"100%"}} 
                >
        <Box display="flex" alignItems="center" justifyContent='space-between' sx={{ py: 1, px: 2, bgcolor: "rgba(0,0,0,0.5)", borderRadius: "0 !important",width:"100%" }}>
          <Typography
            variant="h6"
            fontSize="15px"
            color="white"
            fontWeight='400'
            sx={{
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            Julia Roberts
          </Typography>
                      <Box>
              <Tooltip title="User" placement="top">
                 <Box color="white" sx={{p:0}}>
                 <IconCaretDownFilled width={18} />
                 </Box>
              </Tooltip>
            </Box>
        </Box>
        </IconButton>

        <StyledMenu
        id="demo-customized-menu"
        MenuListProps={{
          'aria-labelledby': 'demo-customized-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={handleClose}  disableRipple>
        <IconButton color="primary" sx={{p:0}}>
          <IconUser width={20} />
          </IconButton>
          <Typography fontSize="15px">My Profile</Typography>
        </MenuItem>
        <MenuItem onClick={handleClose} disableRipple>
        <IconButton color="primary" sx={{p:0}}>
          <IconNote width={20} />
          </IconButton>
          <Typography fontSize="15px">My Notes</Typography>
        </MenuItem>
        <MenuItem onClick={handleClose} disableRipple>
        <IconButton color="success" sx={{p:0}}>
          <IconMail width={20} />
          </IconButton>
          <Typography fontSize="15px">Inbox</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5,borderWidth:"1px",color:(theme:any) => theme.palette.grey[600] }} />
        <MenuItem onClick={handleClose} disableRipple>
        <IconButton color="warning" sx={{p:0}}>
          <IconSettings width={20} />
          </IconButton>
          <Typography fontSize="15px">Account Setting</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5,borderWidth:"1px",color:(theme:any) => theme.palette.grey[600] }} />
        <MenuItem onClick={handleClose} disableRipple>
        <IconButton color="error" sx={{p:0}} component={Link}
                href="/auth/auth1/login">
          <IconLogout width={20} />
          </IconButton>
          <Typography fontSize="15px">Logout</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5,borderWidth:"1px",color:(theme:any) => theme.palette.grey[600] }} />
         <Box sx={{padding:"0 12px"}}>
         <Button variant="contained" color="secondary" sx={{borderRadius:"50px",margin:"0 auto",my:1.5,display:"grid",width:"100%"}}>
      View Profile
    </Button>
    </Box>
     
      </StyledMenu>
      </>
    </Box>
  );
};
