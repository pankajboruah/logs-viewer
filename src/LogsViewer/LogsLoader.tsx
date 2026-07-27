import { Box, CircularProgress, Skeleton, Stack, Typography } from '@mui/material';
import { logsViewerStyled } from './LogsViewer.styled';
import { colors } from '../theme/colors';

const { StyledBoxContent } = logsViewerStyled;

function LogsLoader() {
  return (
    <Stack height='100%'>
      <Skeleton
        variant='rectangular'
        sx={{
          borderRadius: '4px',
          height: '34px',
          width: '708px',
          padding: '0px 8px',
        }}
      />
      <Box
        sx={{
          backgroundColor: colors.background,
          borderRadius: 2,
          paddingBottom: '5px',
          position: 'relative',
          border: `1px solid ${colors.border}`,
          mt: 2,
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <StyledBoxContent>
          <CircularProgress
            color='primary'
            data-testid='spinner-loader'
            sx={{
              height: 24,
              width: 24,
              color: colors.accent,
            }}
          />
          <Typography>Fetching logs...</Typography>
        </StyledBoxContent>
      </Box>
    </Stack>
  );
}

export default LogsLoader;
