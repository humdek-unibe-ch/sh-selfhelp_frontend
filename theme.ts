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
    // Status pills must never be clipped in dense table cells. Mantine's default
    // Badge label is `overflow: hidden; text-overflow: ellipsis` with a capped
    // width, which cut off statuses like "incompatible"/"pre-restore". Let the
    // label show in full (it still stays on one line) across every table.
    Badge: {
      styles: {
        root: { maxWidth: 'none' },
        label: { overflow: 'visible', textOverflow: 'clip' },
      },
    },
  },
});
