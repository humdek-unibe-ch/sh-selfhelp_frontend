"use client";

import { usePagePrefetch } from "../../../../../hooks/usePagePrefetch";
import { IPageItem } from "../../../../../types/common/pages.type";
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