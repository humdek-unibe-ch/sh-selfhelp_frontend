/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { createTheme } from "@mantine/core";

export const theme = createTheme({
  components: {
    MultiSelect: {
      styles: {
        input: {
          display: 'flex',
          alignItems: 'center',
          minHeight: 36,
          paddingTop: 4,
          paddingBottom: 4,
        },
      },
    },
  },
});
