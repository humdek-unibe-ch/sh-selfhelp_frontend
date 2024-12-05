'use client'

import { Box, Loader } from "@mantine/core";

export default function Loading() {
  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100vh",
      }}
    >
      <Loader />
    </Box>
  );
};

