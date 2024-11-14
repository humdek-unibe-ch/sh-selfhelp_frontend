import React, { useState } from 'react';
import {
  IconButton,
  Box,
  Badge,
  MenuItem,
  Avatar,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import Menu, { MenuProps } from '@mui/material/Menu';
import * as dropdownData from './data';
import Scrollbar from '@/app/components/custom-scroll/Scrollbar';
import { styled, alpha } from '@mui/material/styles';
import { IconMessage } from '@tabler/icons-react';
import { Stack } from '@mui/system';
import Link from 'next/link';
import Divider from '@mui/material/Divider';
import { IconChevronRight } from "@tabler/icons-react";

const Messages = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const StyledMenu = styled((props: MenuProps) => (
    <Menu
    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      {...props}
    />
  ))(({ theme }) => ({
    '& .MuiPaper-root': {
      '& .MuiMenuItem-root': {
         '&:hover': {
          backgroundColor: theme.palette.mode==="light"?'#EDF5FD':`${theme.palette.primary.light}`,
        },
      },
    },
  }));


  return (
    <Box color="white">
        <IconButton
        aria-label="show 4 new mails"
        color="inherit"
        onClick={handleClick2}
        size="large"
      >
        <Badge color="error" variant="dot">
        <IconMessage size="22" />
        </Badge>
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <StyledMenu
        id="msgs-menu2"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}

        sx={{
          '& .MuiMenu-paper': {
            width: '360px',
            maxHeight: 'none',
        
            '& .MuiMenu-list':{
              paddingY:0,
            }
          },
        }}
      >
        <Stack direction="column" py={2} px={3} justifyContent="start" color='#fff' alignItems="start" bgcolor={"secondary.main"}>
          <Typography variant="h5" fontSize='20px'>Messages</Typography>
          <Typography variant="h6" fontSize='12px'>You have 5 new messages</Typography>
          
        </Stack>
        <Scrollbar sx={{ height: '385px' }}>
          {dropdownData.messages.map((notification, index) => {
            return (
              <Box key={index}>
                <MenuItem sx={{
                   py: 2,
                    px: 3 ,
                    borderBottom:(theme:any) => `1px solid ${theme.palette.divider}`,
                }}>
                  <Stack direction="row" spacing={2}>
                  <Box
                    minWidth="40px"
                    height="40px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                  <Badge color="success" overlap="circular" badgeContent=" " variant="dot">
                  <Avatar
                    src={notification.avatar}
                    alt={notification.avatar}
                    sx={{
                      width: 42,
                      height: 42,
                    }}
                  />
                </Badge>
                  </Box>
                    <Box >
                      <Box display='flex' justifyContent='space-between'>
                      <Typography
                        variant="subtitle2"
                        color="textPrimary"
                        fontWeight={500}
                        fontSize='14px'
                        width="fit-content"
                        noWrap
                        sx={{
                          width: '200px',
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography
                        color="grey.400"
                        variant="subtitle2"
                        fontSize='12px'
                        lineHeight={1.25}
                        noWrap
                      >
                        {notification.time}
                      </Typography>
                      </Box>
                      <Typography
                        color="grey.400"
                        variant="subtitle2"
                        fontSize='12px'
                        lineHeight={1.25}
                        
                        sx={{
                          width: '200px',
                        }}
                      >
                        {notification.subtitle}
                      </Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              </Box>
            )
          })}
        </Scrollbar>
        <Box p={3} pb={1}>
          <Button href="/apps/email" variant="contained" component={Link} color="secondary" sx={{borderRadius:"50px",display:"flex",gap:"6px",lineHeight:2}} fullWidth>
               Check all Messages <IconChevronRight width={18} /> 
          </Button>
        </Box>
      </StyledMenu>
    </Box>
  );
};

export default Messages;
