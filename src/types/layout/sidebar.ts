/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IMenuitemsType {
   id?: string;
   navlabel?: boolean;
   subheader?: string;
   title?: string;
   icon?: any;
   href?: string;
   children?: IMenuitemsType[];
   chip?: string;
   chipColor?: string;
   variant?: string;
   external?: boolean;
 }
