/**
 * @fileoverview A reusable loading spinner component using Material-UI's CircularProgress.
 * This component provides a centered loading indicator with customizable properties.
 */

import { CircularProgress, Box, BoxProps } from '@mui/material';

/**
 * Props interface for the LoadingSpinner component.
 * Extends Material-UI's BoxProps to allow for all Box component properties.
 *
 * @interface LoadingSpinnerProps
 * @extends {BoxProps}
 */
interface LoadingSpinnerProps extends BoxProps {
    /** The size of the spinner in pixels */
    size?: number;
    /** The thickness of the spinner's circle */
    thickness?: number;
    /** The minimum height of the container */
    minHeight?: string | number;
}

/**
 * A centered loading spinner component with customizable properties.
 * Wraps Material-UI's CircularProgress in a flex container for easy positioning.
 *
 * @component
 * @example
 * // Basic usage
 * <LoadingSpinner />
 *
 * @example
 * // Custom size and thickness
 * <LoadingSpinner size={60} thickness={5} minHeight="300px" />
 *
 * @example
 * // With additional Box props
 * <LoadingSpinner sx={{ bgcolor: 'background.paper' }} />
 */
export const LoadingSpinner = ({
    size = 40,
    thickness = 4,
    minHeight = '50vh',
    ...boxProps
}: LoadingSpinnerProps) => {
    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={minHeight}
            {...boxProps}
        >
            <CircularProgress size={size} thickness={thickness} />
        </Box>
    );
};

export default LoadingSpinner;
