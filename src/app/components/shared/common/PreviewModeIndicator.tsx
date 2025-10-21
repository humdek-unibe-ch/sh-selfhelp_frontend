/**
 * Preview mode indicator component.
 * Displays a prominent banner when the page is in preview mode.
 *
 * @module components/shared/common/PreviewModeIndicator
 */

'use client';

import { Alert, Box } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { usePreviewMode } from '../../../../hooks/usePreviewMode';

interface IPreviewModeIndicatorProps {
  /** Whether to show the indicator only when in preview mode */
  showOnlyInPreview?: boolean;
  /** Whether this indicator is placed inside a header */
  inHeader?: boolean;
}

/**
 * Component that displays a preview mode indicator banner.
 * Shows when preview mode is enabled to make it clear the page is in preview.
 */
export function PreviewModeIndicator({ showOnlyInPreview = true, inHeader = false }: IPreviewModeIndicatorProps) {
  const { isPreviewMode } = usePreviewMode();

  // Don't render if not in preview mode and showOnlyInPreview is true
  if (!isPreviewMode && showOnlyInPreview) {
    return null;
  }

  const headerStyles = inHeader ? {
    padding: '4px 12px',
    fontSize: '12px',
    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
    borderRadius: '4px',
    margin: '4px 0',
    width: 'fit-content'
  } : {
    position: 'relative',
    width: '100%',
    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
    color: 'white',
    padding: '8px 16px',
    fontWeight: 600,
    fontSize: '14px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    borderBottom: '2px solid rgba(255,255,255,0.3)',
  };

  return (
    <Box style={headerStyles}>
      <Box style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        color: 'white'
      }}>
        <IconEye size={inHeader ? 14 : 16} />
        {inHeader ? 'PREVIEW MODE' : 'PREVIEW MODE - This page shows draft content'}
      </Box>
    </Box>
  );
}
