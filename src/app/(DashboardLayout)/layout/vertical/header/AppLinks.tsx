import { Avatar, Box, Typography, Grid, Stack,ListItemIcon } from '@mui/material';
import * as dropdownData from './data';
import Link from 'next/link';
import React from 'react';

const AppLinks = () => {
  return (
    <Grid container spacing={3} mb={4}>
      {dropdownData.appsLink.map((links, index) => {
        const Icon = links.icon;
        const itemIcon = <Icon/>;
        const bgvalue = links.bgcolor;
        const colorvalue = links.color;
        return (
          <Grid item lg={6} key={index}>
            <Link href={links.href} className="hover-text-primary">
              <Stack direction="row" spacing={2}>
                <Box
                  minWidth="40px"
                  height="40px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    bgcolor:`${bgvalue}`,
                    color:`${colorvalue}`,
                    borderRadius:"50px"
                  }}
                >
          <Icon size="20px" />
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={500}
                    color="textPrimary"
                    noWrap
                    className="text-hover"
                    sx={{
                      width: '240px',
                      
                    }}
                  >
                    {links.title}
                  </Typography>
                  <Typography
                    color="grey.400"
                    variant="subtitle2"
                    fontSize="14px"
                    fontWeight={400}
                    sx={{
                      width: '240px',
                      lineHeight:1
                    }}
                    noWrap
                  >
                    {links.subtext}
                  </Typography>
                </Box>
              </Stack>
            </Link>
          </Grid>
        )
      })}
    </Grid>
  );
};

export default AppLinks;
