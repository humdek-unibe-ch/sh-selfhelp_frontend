import React from 'react';
import { useSelector, useDispatch } from "@/store/hooks";
import { setDarkMode } from "@/store/customizer/CustomizerSlice";
import { AppState } from "@/store/store";
import { ActionIcon, Box } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

const DarkLightMode = () => {
  const customizer = useSelector((state: AppState) => state.customizer);
  const dispatch = useDispatch();

  const handleMode = () => {
    dispatch(setDarkMode(customizer.activeMode === "light" ? "dark" : "light"));
  };

  return (
    <Box c="white">
      <ActionIcon
        variant="transparent"
        color="white"
        onClick={handleMode}
        size="lg"
        aria-label="Toggle theme"
      >
        {customizer.activeMode === "light" ? (
          <IconMoon size="1.3rem" />
        ) : (
          <IconSun size="1.3rem" />
        )}
      </ActionIcon>
    </Box>
  );
};

export default DarkLightMode;
