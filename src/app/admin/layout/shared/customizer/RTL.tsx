/**
 * @fileoverview RTL component that provides right-to-left text direction support
 * using Emotion cache and Redux state management.
 */

import React, { useEffect } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import rtlPlugin from 'stylis-plugin-rtl';
import { useSelector } from '@/store/hooks';
import { AppState } from '@/store/store';

interface RTLProps {
  children: React.ReactNode;
}

/**
 * Creates a new Emotion cache with RTL support
 * @returns {EmotionCache} Configured Emotion cache
 */
const styleCache = () =>
  createCache({
    key: 'rtl',
    prepend: true,
    stylisPlugins: [rtlPlugin],
  });

/**
 * RTL component that provides right-to-left text direction support.
 * Uses Redux state to determine the current direction.
 * 
 * @component
 * @param {RTLProps} props - Component props
 * @returns {JSX.Element} RTL-wrapped children
 */
const RTL = ({ children }: RTLProps) => {
  const { activeDir } = useSelector((state: AppState) => state.customizer);

  useEffect(() => {
    document.dir = activeDir;
  }, [activeDir]);

  if (activeDir === 'rtl') {
    return <CacheProvider value={styleCache()}>{children}</CacheProvider>;
  }

  return <>{children}</>;
};

export default RTL;
