/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState, type ReactNode } from 'react';
import { Image, Tooltip, Center } from '@mantine/core';
import { IconLock, IconPhotoOff } from '@tabler/icons-react';

interface IAssetThumbnailProps {
  src: string;
  alt: string;
  /**
   * What the server says about the caller (`asset.can_view`): `false` = the
   * caller is in none of the asset's groups, so the preview is not requested and
   * the "no access" lock is shown. Omitted = no claim either way.
   */
  canView?: boolean;
}

const BOX = 40;

function Placeholder({ label, tooltip, children }: { label: string; tooltip: string; children: ReactNode }) {
  return (
    <Tooltip label={tooltip}>
      <Center
        w={BOX}
        h={BOX}
        bg="var(--mantine-color-gray-1)"
        style={{ borderRadius: 'var(--mantine-radius-md)', flexShrink: 0 }}
        role="img"
        aria-label={label}
      >
        {children}
      </Center>
    </Tooltip>
  );
}

/**
 * Asset preview thumbnail with two distinct placeholders, because they mean
 * different things:
 *
 * - **No access** (lock): the server told us (`canView === false`) that the
 *   caller is in none of the asset's groups, so the delivery route would answer
 *   `403`. Shown without requesting the bytes. This is an expected state, never
 *   a toast.
 * - **Preview unavailable**: the caller may view the asset but the image did not
 *   load (file missing, undecodable, network). The browser does not expose the
 *   status to an `<img>`, so this must NOT claim "no access"; it says the
 *   preview could not be loaded.
 */
export function AssetThumbnail({ src, alt, canView }: IAssetThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Track WHICH src failed rather than a bare boolean: rows are keyed by
  // `asset.id`, so this component is reused (not remounted) when the list
  // refetches. A bare flag would latch the placeholder on forever, e.g. after
  // the file is replaced under the same row.
  const failed = failedSrc === src;

  if (canView === false) {
    return (
      <Placeholder
        label={`${alt} — no access`}
        tooltip="No preview: you are not in any of this asset's groups"
      >
        <IconLock size={16} color="var(--mantine-color-gray-6)" aria-hidden />
      </Placeholder>
    );
  }

  if (failed) {
    return (
      <Placeholder
        label={`${alt} — preview unavailable`}
        tooltip="Preview unavailable: the file could not be loaded"
      >
        <IconPhotoOff size={16} color="var(--mantine-color-gray-6)" aria-hidden />
      </Placeholder>
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
