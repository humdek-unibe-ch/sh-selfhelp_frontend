import { CircularProgress, Box, BoxProps } from '@mui/material';

interface LoadingSpinnerProps extends BoxProps {
    size?: number;
    thickness?: number;
    minHeight?: string | number;
}

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
