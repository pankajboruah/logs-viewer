import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LogsViewer, { LogEntry } from '../LogsViewer';
import { generateMockLogs } from './mockLogs';

type Mode = 'STATIC' | 'LIVE';

const INITIAL_LOG_COUNT = 40;
const PAGE_SIZE = 20;

export default function DemoApp() {
  const [mode, setMode] = useState<Mode>('STATIC');
  const [logs, setLogs] = useState<LogEntry[]>(() => generateMockLogs(INITIAL_LOG_COUNT));
  const [keywordInput, setKeywordInput] = useState('error');
  const [showBottomLoader, setShowBottomLoader] = useState(false);
  const [showTopLoader, setShowTopLoader] = useState(false);
  const [topLogsAddedCount, setTopLogsAddedCount] = useState<number | undefined>(undefined);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedLineNumber, setExpandedLineNumber] = useState<number | null>(null);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const keywords = keywordInput.trim() ? [keywordInput.trim()] : [];

  const handleLoadMoreBottom = () => {
    if (showBottomLoader) {
      return;
    }
    setShowBottomLoader(true);
    setTimeout(() => {
      setLogs((prev) => [...prev, ...generateMockLogs(PAGE_SIZE, Date.now())]);
      setShowBottomLoader(false);
    }, 800);
  };

  const handleLoadMoreTop = () => {
    if (showTopLoader) {
      return;
    }
    setShowTopLoader(true);
    setTimeout(() => {
      const older = generateMockLogs(PAGE_SIZE, Date.now() - PAGE_SIZE * 5000);
      setLogs((prev) => [...older, ...prev]);
      setTopLogsAddedCount(older.length);
      setShowTopLoader(false);
    }, 800);
  };

  // Live-tail: append a new log line every second while unpaused.
  useEffect(() => {
    if (mode !== 'LIVE') {
      return undefined;
    }
    if (isPaused) {
      return undefined;
    }
    liveIntervalRef.current = setInterval(() => {
      setLogs((prev) => [...prev, ...generateMockLogs(1, Date.now())]);
    }, 1000);
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
      }
    };
  }, [mode, isPaused]);

  const headerComponent = (
    <Stack direction='row' alignItems='center' spacing={2} width='100%'>
      <TextField
        size='small'
        label='Search keyword'
        value={keywordInput}
        onChange={(e) => setKeywordInput(e.target.value)}
      />
    </Stack>
  );

  const commonLogsViewerProps = {
    logs,
    keywords,
    headerComponent,
    showExpandLogContext: true as const,
    onExpandLogContextClicked: (lineNumber: number) => setExpandedLineNumber(lineNumber),
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 3, gap: 2 }}>
      <Typography variant='h5'>LogsViewer Demo</Typography>

      <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap'>
        <Select size='small' value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <MenuItem value='STATIC'>STATIC</MenuItem>
          <MenuItem value='LIVE'>LIVE</MenuItem>
        </Select>

        {mode !== 'LIVE' && (
          <>
            <Button variant='outlined' onClick={handleLoadMoreTop} disabled={showTopLoader}>
              Load more (top)
            </Button>
            <Button variant='outlined' onClick={handleLoadMoreBottom} disabled={showBottomLoader}>
              Load more (bottom)
            </Button>
          </>
        )}
      </Stack>

      <Box flex={1} minHeight={0}>
        {mode === 'LIVE' ? (
          <LogsViewer
            {...commonLogsViewerProps}
            mode='LIVE'
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            invertLogsOrder
          />
        ) : (
          <LogsViewer
            {...commonLogsViewerProps}
            mode={mode}
            showBottomLoader={showBottomLoader}
            showTopLoader={showTopLoader}
            topLogsAddedCount={topLogsAddedCount}
            handleOnScrollBottom={handleLoadMoreBottom}
            handleOnScrollTop={(scrollCallback: (lineNumberToScrollTo: number) => void) => {
              handleLoadMoreTop();
              scrollCallback(topLogsAddedCount ?? 0);
            }}
          />
        )}
      </Box>

      <Dialog
        open={expandedLineNumber !== null}
        onClose={() => setExpandedLineNumber(null)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>Surrounding logs (line {expandedLineNumber})</DialogTitle>
        <DialogContent sx={{ height: '60vh' }}>
          <LogsViewer
            mode='SURROUNDING_LOGS'
            logs={logs}
            keywords={keywords}
            focusedLineNumber={expandedLineNumber}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
