/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import { Image, Tooltip, Center } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

interface IAssetThumbnailProps {
  src: string;
  alt: string;
}

const BOX = 75;

/**
 * Asset preview thumbnail that degrades to a "no access" placeholder.
 *
 * Since core 0.1.41 asset bytes come from the ACL-enforced delivery route, so a
 * `403` on an image is an EXPECTED state (the folder is closed to this user),
 * not a bug. The admin list still shows such assets — folder ACLs filter the
 * listing, but an asset can become unreadable between fetch and render — so we
 * render a lock placeholder instead of a broken-image icon, and deliberately
 * raise no error toast.
 *
 * `onError` cannot distinguish 403 from 404/decode failures (the browser does
 * not expose the status to an <img>), so the placeholder covers every
 * unrenderable case; "no access" is by far the common one here.
 */
export function AssetThumbnail({ src, alt }: IAssetThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Track WHICH src failed rather than a bare boolean: rows are keyed by
  // `asset.id`, so this component is reused (not remounted) when the list
  // refetches. A bare flag would latch the placeholder on forever — e.g. after
  // the folder is made public and the same row's image becomes readable again.
  const failed = failedSrc === src;

  if (failed) {
    return (
      <Tooltip label="No access — you cannot view files in this folder">
        <Center
          w={BOX}
          h={BOX}
          bg="var(--mantine-color-gray-1)"
          style={{ borderRadius: 'var(--mantine-radius-md)', flexShrink: 0 }}
          role="img"
          aria-label={`${alt} — no access`}
        >
          <IconLock size={20} color="var(--mantine-color-gray-6)" aria-hidden />
        </Center>
      </Tooltip>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fit="contain"
      radius="md"
      style={{ maxWidth: `${BOX}px`, maxHeight: `${BOX}px` }}
      onError={() => setFailedSrc(src)}
    />
  );
}
