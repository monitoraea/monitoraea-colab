import { Box } from '@mui/material';
import { forwardRef } from 'react';

export const CardBody = forwardRef(function CardBody({ variant = 'default', sx, children, ...rest }, ref) {
  let styles = {};
  if (variant === 'colorful') {
    styles = { backgroundColor: 'beige.main', borderRadius: 2, p: 3 };
  }
  styles = { ...styles, ...sx };

  return (
    <Box ref={ref} sx={styles} {...rest}>
      {children}
    </Box>
  );
});
