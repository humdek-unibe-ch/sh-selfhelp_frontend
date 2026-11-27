/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Box, Splitter } from '@mantine/core';
import type { SplitterPaneSize } from '@mantine/hooks';
import { useInspectorStore } from '../../../../store/inspectorStore';
import {
  clampPageEditorSplit,
  PAGE_EDITOR_SPLIT_DEFAULT,
  readPersistedPageEditorSplit,
} from '../../../../store/pageEditorSplit';
import { useIsClient } from '../../../../hooks/useIsClient';

type PageEditorSplitterProps = {
  tree: ReactNode;
  inspector: ReactNode;
};

/**
 * Controlled page-editor Splitter that remembers sizes in localStorage.
 *
 * Bootstrap (no setState-in-effect, no hydration mismatch, no 55/45 flash):
 * - SSR / first hydrate paint: a visible flex placeholder at the default 55/45
 *   (localStorage is unavailable on the server).
 * - After hydrate (`useIsClient`): this component mounts fresh and seeds
 *   `useState` from `readPersistedPageEditorSplit()`, so the first Splitter
 *   paint already uses the stored width.
 */
export function PageEditorSplitter({ tree, inspector }: PageEditorSplitterProps) {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <Box
        h="100%"
        data-admin-page-editor
        style={{ display: 'flex', minHeight: 0 }}
      >
        <Box style={{ width: `${PAGE_EDITOR_SPLIT_DEFAULT[0]}%`, minWidth: 0, minHeight: 0, overflow: 'auto' }}>
          {tree}
        </Box>
        <Box style={{ width: `${PAGE_EDITOR_SPLIT_DEFAULT[1]}%`, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          {inspector}
        </Box>
      </Box>
    );
  }

  return <PageEditorSplitterClient tree={tree} inspector={inspector} />;
}

function PageEditorSplitterClient({ tree, inspector }: PageEditorSplitterProps) {
  const setPageEditorSplit = useInspectorStore((state) => state.setPageEditorSplit);
  const [splitSizes, setSplitSizes] = useState<SplitterPaneSize[]>(() =>
    clampPageEditorSplit(readPersistedPageEditorSplit()),
  );
  // Mantine's double-click reset updates sizes via onSizeChange but does not
  // call onResizeEnd. Debounce-persist so a reset (and a paused drag) stick.
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistSizes = (sizes: SplitterPaneSize[]) => {
    setPageEditorSplit(clampPageEditorSplit(sizes));
  };

  const handleSplitChange = (sizes: SplitterPaneSize[]) => {
    setSplitSizes(sizes);
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => persistSizes(sizes), 120);
  };

  const handleSplitResizeEnd = (_handleIndex: number, sizes: SplitterPaneSize[]) => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    const clamped = clampPageEditorSplit(sizes);
    setSplitSizes(clamped);
    setPageEditorSplit(clamped);
  };

  useEffect(() => () => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
  }, []);

  // Mantine's handle has no accessible name; label it once the DOM is ready.
  useEffect(() => {
    const root = document.querySelector('[data-admin-page-editor]');
    const handles = root?.querySelectorAll('[data-splitter-handle], .mantine-Splitter-handle');
    handles?.forEach((handle) => {
      if (!handle.getAttribute('aria-label')) {
        handle.setAttribute('aria-label', 'Resize editor panels');
      }
    });
  }, [splitSizes]);

  return (
    <Box h="100%" data-admin-page-editor style={{ minHeight: 0 }}>
      <Splitter
        h="100%"
        style={{ minHeight: 0 }}
        sizes={splitSizes}
        onSizeChange={handleSplitChange}
        onResizeEnd={handleSplitResizeEnd}
        resetOnDoubleClick
      >
        <Splitter.Pane defaultSize={PAGE_EDITOR_SPLIT_DEFAULT[0]} min={25}>
          {tree}
        </Splitter.Pane>
        <Splitter.Pane defaultSize={PAGE_EDITOR_SPLIT_DEFAULT[1]} min={30}>
          <Box h="100%" style={{ overflow: 'hidden' }}>
            {inspector}
          </Box>
        </Splitter.Pane>
      </Splitter>
    </Box>
  );
}
