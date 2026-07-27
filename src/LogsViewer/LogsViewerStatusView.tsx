import { ReactNode } from 'react';
import { CircularProgress, Typography } from '@mui/material';
import DesktopAccessDisabledIcon from '@mui/icons-material/DesktopAccessDisabled';
import { colors } from '../theme/colors';
import { logsViewerStyled } from './LogsViewer.styled';
import EmptyStateText from '../components/EmptyStateText';

const { StyledBoxContainer, StyledBoxContent } = logsViewerStyled;

export default function LogsViewerStatusView({
  message,
  hasNoLogs,
  loading,
  mode,
}: {
  message?: ReactNode;
  hasNoLogs: boolean;
  loading: boolean;
  mode?: 'STATIC' | 'SURROUNDING_LOGS' | 'LIVE' | 'ALL_APPLICATION_LOGS';
}) {
  const isAllApplicationLogsMode = mode === 'ALL_APPLICATION_LOGS';

  return (
    <>
      {loading && (
        <StyledBoxContainer
          sx={{ minHeight: '100%' }}
          isAllApplicationLogsMode={isAllApplicationLogsMode}
        >
          <StyledBoxContent>
            <CircularProgress
              color='primary'
              data-testid='spinner-loader'
              style={{
                height: '24px',
                width: '24px',
                color: colors.accent,
              }}
            />
            <Typography>Fetching logs...</Typography>
          </StyledBoxContent>
        </StyledBoxContainer>
      )}
      {!loading && hasNoLogs && (
        <StyledBoxContainer
          isAllApplicationLogsMode={isAllApplicationLogsMode}
          sx={{ minHeight: '100%' }}
        >
          {message || <EmptyStateText icon={<DesktopAccessDisabledIcon />} title='No logs found' />}
        </StyledBoxContainer>
      )}
    </>
  );
}
