import React, { useState } from 'react';
import {
  IconButton,
  Box,
} from '@mui/material';
import { useSelector, useDispatch } from "@/store/hooks";
import WbSunnyTwoToneIcon from "@mui/icons-material/WbSunnyTwoTone";
import {
  setDarkMode,
} from "@/store/customizer/CustomizerSlice";
import { AppState } from "@/store/store";
import DarkModeTwoToneIcon from "@mui/icons-material/DarkModeTwoTone";

const DarkLightMode = () => {

    const customizer = useSelector((state: AppState) => state.customizer);

    const dispatch = useDispatch();

    const handleMode = () => {
        customizer.activeMode === "light" ? dispatch(setDarkMode("dark")) : dispatch(setDarkMode("light")) 
    }


  return (
    <Box color='white'>
        <IconButton
        aria-label="show 4 new mails"
        color="inherit"
        onClick={handleMode}
        size="large"
      >
    <WbSunnyTwoToneIcon sx={{display:(theme)=>theme.palette.mode==="light"?"none":"block"}}/>
    <DarkModeTwoToneIcon sx={{display:(theme)=>theme.palette.mode==="light"?"block":"none"}}/>
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
    </Box>
  );
};

export default DarkLightMode;
