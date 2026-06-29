/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { createTheme, Modal } from "@mantine/core";

export const theme = createTheme({
  components: {
    // Modals are dismissible only via their own close / cancel control by
    // default: no accidental close on an outside click or Escape (which used to
    // discard unsaved edits, e.g. the data-table "Manage" editor). A specific
    // modal opts back in by passing `closeOnClickOutside` / `closeOnEscape`.
    Modal: Modal.extend({
      defaultProps: {
        closeOnClickOutside: false,
        closeOnEscape: false,
      },
    }),
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
