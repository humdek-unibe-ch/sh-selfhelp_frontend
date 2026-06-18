/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { type ElementType } from 'react';

export interface IMenuitemsType {
   id?: string;
   navlabel?: boolean;
   subheader?: string;
   title?: string;
   icon?: ElementType;
   href?: string;
   children?: IMenuitemsType[];
   chip?: string;
   chipColor?: string;
   variant?: string;
   external?: boolean;
 }
