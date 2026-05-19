/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { usePagePrefetch } from "../../../../../hooks/usePagePrefetch";
import { IPageItem } from "../../../../../shared";
import { InternalLink } from "../../../shared";

export function FooterLinks({ footerPages }: { footerPages: IPageItem[] }) {
  const { createHoverPrefetch } = usePagePrefetch();

  return footerPages.map((page) => (
    <InternalLink
      key={page.id_pages}
      href={page.url || ""}
      onMouseEnter={
        page.keyword ? createHoverPrefetch(page.keyword) : undefined
      }
    >
      {page.title}
    </InternalLink>
  ));
}