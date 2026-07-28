import { ReactNode } from 'react';
import { Box, Grid } from '@mui/material';

function LogsViewerHeader({ children }: { children?: ReactNode }) {
  if (!children) {
    return null;
  }

  return (
    <Box>
      <Grid container height='52px'>
        {children}
      </Grid>
    </Box>
  );
}

export default LogsViewerHeader;
