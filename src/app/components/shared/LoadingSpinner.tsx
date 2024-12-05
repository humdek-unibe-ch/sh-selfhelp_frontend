/**
 * @fileoverview A reusable loading spinner component using Mantine's Loader.
 * This component provides a centered loading indicator with customizable properties.
 */

import { Loader, Box, BoxProps } from '@mantine/core';

/**
 * Props interface for the LoadingSpinner component.
 * Extends Mantine's BoxProps to allow for all Box component properties.
 *
 * @interface LoadingSpinnerProps
 * @extends {BoxProps}
 */
interface LoadingSpinnerProps extends BoxProps {
    /** The size of the spinner in pixels */
    size?: number;
    /** The thickness of the spinner's circle (not applicable in Mantine) */
    thickness?: number;
    /** The minimum height of the container */
    minHeight?: string | number;
}

/**
 * A centered loading spinner component with customizable properties.
 * Uses Mantine's Loader component in a flex container for easy positioning.
 *
 * @component
 * @example
 * // Basic usage
 * <LoadingSpinner />
 *
 * @example
 * // Custom size
 * <LoadingSpinner size={60} minHeight="300px" />
 *
 * @example
 * // With additional Box props
 * <LoadingSpinner bg="var(--mantine-color-body)" />
 */
export const LoadingSpinner = ({
    size = 40,
    thickness: _thickness, // Ignored as Mantine's Loader doesn't have thickness prop
    minHeight = '50vh',
    ...boxProps
}: LoadingSpinnerProps) => {
    return (
        <Box
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: minHeight
            }}
            {...boxProps}
        >
            <Loader size={size} />
        </Box>
    );
};

export default LoadingSpinner;
