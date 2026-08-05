import { useTheme, useMediaQuery } from '@mui/material';
export const useIsMobile = () => useMediaQuery(useTheme().breakpoints.down('sm'));
