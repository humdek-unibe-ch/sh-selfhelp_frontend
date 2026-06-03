/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { setupServer } from 'msw/node';
import { defaultHandlers } from './createHandlers';

/** Shared MSW server for the Vitest run (lifecycle managed in setup.ts). */
export const server = setupServer(...defaultHandlers);
