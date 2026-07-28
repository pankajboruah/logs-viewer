import { useEffect, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Grid, Box, Typography, Stack } from '@mui/material';
import InformationIcon from '../assets/ColorInformation.svg?react';
import LogsViewerStatusView from './LogsViewerStatusView';
import LogsViewerHeader from './LogsViewerHeader';
import PausePlayButton from './PausePlayButton';
import createExpandOverlayWidget from './ExpandOverlayWidget';
import useLogDecorations from './useLogDecorations';
import calculateTimeElapsed from '../utils/calculateTimeElapsed';
import { colors } from '../theme/colors';
import { logsViewerConstants } from './LogsViewer.constants';
import {
  StaticLogsViewerProps,
  LiveLogsViewerProps,
  LogsWithExpandContext,
  LogsWithoutExpandContext,
} from './LogsViewer.types';
import { logsViewerUtils } from './LogsViewer.utils';
import { editorUtils } from './Editor.utils';
import { logsViewerStyled } from './LogsViewer.styled';

const { customGuidesOptions, globalOptions, editorOptions } = logsViewerConstants;

const {
  attachWordWrapResizeObserver,
  createLiveTailPauseHandler,
  createPaginationScrollHandler,
  scrollToBottomMostLog,
  scrollToTopMostLog,
  updateWordWrapColumn,
} = editorUtils;

const { generateLogText, getDummyLog } = logsViewerUtils;

const { StyledEditorContainer } = logsViewerStyled;

function LogsViewer({
  containerHeight,
  focusedLineNumber,
  handleOnScrollBottom,
  handleOnScrollTop,
  headerComponent,
  infoText,
  invertLogsOrder = false,
  isPaused,
  keywords,
  logs,
  mode = 'STATIC',
  noLogsForLongInfo = { showInfo: false, latestLogTimestampInMilliseconds: 0 },
  onExpandLogContextClicked,
  refreshToggled,
  setIsPaused,
  showBottomLoader,
  showExpandLogContext = false,
  showLineNumbers = false,
  showLoader = false,
  showTimeInUTC = false,
  showTopLoader,
  statusMessage,
  topLogsAddedCount,
}: (StaticLogsViewerProps | LiveLogsViewerProps) &
  (LogsWithExpandContext | LogsWithoutExpandContext)) {
  const editorRef = useRef<null | monaco.editor.IStandaloneCodeEditor>(null);
  const editorContainerRef = useRef<null | HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const stopScrollingToFocusedLineRef = useRef<boolean>(false);
  const listenScrollToTopActions = useRef<boolean>(false);
  const listenScrollToBottomActions = useRef<boolean>(false);

  const decorations = useLogDecorations();

  const logsWithLoader = useMemo(() => {
    if (showBottomLoader) {
      return [...logs, getDummyLog(logs)];
    } else if (showTopLoader) {
      return [getDummyLog(logs), ...logs];
    }
    return logs;
  }, [logs, showBottomLoader, showTopLoader]);

  const showFocusedLine = (
    editorInstance: monaco.editor.IStandaloneCodeEditor,
    lineNumberToFocus: number
  ) => {
    editorInstance.revealLineInCenter(lineNumberToFocus, monaco.editor.ScrollType.Immediate);
    editorInstance.setPosition({ lineNumber: lineNumberToFocus, column: 0 });
    // Setting this to true here since I want "showFocusedLine" to be called only once(when logs have rendered in the editor)
    stopScrollingToFocusedLineRef.current = true;
  };

  const updateViewer = (editorInstance: monaco.editor.IStandaloneCodeEditor) => {
    const value = generateLogText(logsWithLoader, showTimeInUTC);
    editorInstance.setValue(value);
    decorations.highlightKeywords(editorInstance, keywords);
    decorations.applyDateTextHighlightDecorators(editorInstance);
    if (mode === 'LIVE') {
      if (!isPaused) {
        if (invertLogsOrder) {
          scrollToBottomMostLog({
            editor: editorInstance,
            logs: logsWithLoader,
          });
        } else {
          scrollToTopMostLog({
            editor: editorInstance,
            logs: logsWithLoader,
          });
        }
      }
      updateWordWrapColumn(editorInstance);
    }
  };

  const updateContextViewer = (editorInstance: monaco.editor.IStandaloneCodeEditor) => {
    if (typeof focusedLineNumber === 'number') {
      if (!stopScrollingToFocusedLineRef.current) {
        showFocusedLine(editorInstance, focusedLineNumber);
      }
      decorations.applyFocusedLineDecorators(editorInstance, focusedLineNumber);
    }
  };

  const handleOnMount = (editorInstance: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
    const model = editorInstance.getModel();
    let lineOptions: monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions = {
      lineNumbers: 'on',
    };
    if (!showLineNumbers) {
      lineOptions = {
        lineNumbers: 'off',
        glyphMargin: true,
        folding: false,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0,
      };
    }

    editorInstance.updateOptions({
      ...editorOptions(),
      ...globalOptions(),
      guides: {
        ...customGuidesOptions,
      },
      ...lineOptions,
    });

    // Add keyboard event listener for Command+F/Ctrl+F
    editorInstance.onKeyDown((e: monaco.IKeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.browserEvent.key === 'f') {
        e.preventDefault();
        e.stopPropagation();

        // Find the search bar input and focus it
        const searchBarInput = document.querySelector(
          'input[aria-autocomplete="list"]'
        ) as HTMLInputElement;

        if (searchBarInput) {
          searchBarInput.focus();
        }
      }
    });

    if (showExpandLogContext && model) {
      editorInstance.addOverlayWidget(
        createExpandOverlayWidget({
          editorInstance,
          isLastLineLoading: decorations.isLastLineLoading,
          onExpandLogContextClicked,
        })
      );
    }

    if (mode === 'LIVE') {
      editorInstance.onDidScrollChange(
        createLiveTailPauseHandler({
          invertLogsOrder,
          onUserScroll: () => setIsPaused?.(true),
        })
      );

      if (editorContainerRef.current !== null) {
        attachWordWrapResizeObserver(editorInstance, editorContainerRef.current, resizeObserverRef);
      }
    } else {
      const onPaginationScroll = createPaginationScrollHandler({
        handleOnScrollBottom,
        handleOnScrollTop,
        listenScrollToTopActionsRef: listenScrollToTopActions,
        listenScrollToBottomActionsRef: listenScrollToBottomActions,
      });
      editorInstance.onDidScrollChange((e) => onPaginationScroll(editorInstance, e));
    }

    if (mode !== 'SURROUNDING_LOGS') {
      editorInstance.onMouseMove((e) => {
        const { position } = e.target;
        if (position) {
          decorations.applyFocusedLineDecorators(editorInstance, position.lineNumber);
        }
      });
    }

    updateViewer(editorInstance);
    updateContextViewer(editorInstance);
  };

  useEffect(() => {
    if (editorRef.current) {
      updateViewer(editorRef.current);
    }
  }, [isPaused, keywords, logsWithLoader, mode, showTimeInUTC]);

  useEffect(() => {
    if (editorRef.current && !showLoader && logsWithLoader.length > 0) {
      updateContextViewer(editorRef.current);
    }
    if (showLoader) {
      stopScrollingToFocusedLineRef.current = false;
    }
  }, [focusedLineNumber, showLoader, logsWithLoader]);

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        if (showBottomLoader) {
          decorations.hideLoadingLogLine(model, 'BOTTOM');
        } else {
          decorations.showLoadingLogLine(model, 'BOTTOM');
        }
      }
    }
  }, [showBottomLoader]);

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        if (showTopLoader) {
          decorations.hideLoadingLogLine(model, 'TOP');
        } else {
          decorations.showLoadingLogLine(model, 'TOP');
          if (topLogsAddedCount) {
            // scrolling down to simulate adding of logs on top of current position
            const position = editorRef.current.getTopForPosition(topLogsAddedCount, 0);
            editorRef.current.setScrollPosition(
              { scrollTop: position },
              monaco.editor.ScrollType.Immediate
            );
          }
        }
      }
    }
  }, [showTopLoader, topLogsAddedCount]);

  useEffect(() => {
    if (showLoader || showBottomLoader || showTopLoader) {
      listenScrollToTopActions.current = false;
      listenScrollToBottomActions.current = false;
    }
  }, [refreshToggled, showLoader, showBottomLoader, showTopLoader]);

  useEffect(() => {
    if (editorRef.current) {
      scrollToTopMostLog({
        editor: editorRef.current,
        logs: logsWithLoader,
      });
    }
  }, [refreshToggled]);

  useEffect(
    () => () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    },
    []
  );

  const showInformative = noLogsForLongInfo.showInfo || !!infoText;
  const informativeText = (() => {
    let text = infoText || '';

    if (noLogsForLongInfo.showInfo) {
      const latestTimestamp = noLogsForLongInfo.latestLogTimestampInMilliseconds;
      const timeElapsed = calculateTimeElapsed(latestTimestamp, false, true);
      text = `No new logs have been generated in the last ${timeElapsed}`;
    }

    return text;
  })();

  return (
    <Stack height='100%'>
      <LogsViewerHeader>{headerComponent}</LogsViewerHeader>
      <Box
        sx={{
          backgroundColor: colors.background,
          color: colors.textPrimary,
          borderRadius: 2,
          paddingBottom: '5px',
          position: 'relative',
          border: `1px solid ${colors.border}`,
          flex: 1,
        }}
        height={containerHeight}
      >
        <Grid component={Grid} item xs={12} height='100%' display='flex' flexDirection='column'>
          <Box
            sx={{
              borderRadius: 'inherit',
              display: 'flex',
              position: 'relative',
              flex: 1,
              height: 'unset',
            }}
          >
            <StyledEditorContainer
              sx={{
                width: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                paddingLeft: '16px',
                paddingTop: '8px',
                paddingBottom: mode === 'SURROUNDING_LOGS' ? '16px' : '0',
                height: '100%',
              }}
              ref={editorContainerRef}
              editorWidth={editorRef.current?.getScrollWidth() ?? 0}
            >
              {showInformative && (
                <Stack direction='row' alignItems='center' marginBottom={1}>
                  <Stack direction='row' alignItems='center' gap={1} width='100%'>
                    <InformationIcon />
                    <Typography variant='body2' color={colors.textPrimary}>
                      {informativeText}
                    </Typography>
                  </Stack>
                </Stack>
              )}
              <Editor
                key={mode}
                theme='vs-dark'
                defaultLanguage='plaintext'
                height='100%'
                onMount={handleOnMount}
                options={{
                  glyphMargin: false,
                  renderLineHighlight: 'none',
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    useShadows: false,
                  },
                }}
              />
            </StyledEditorContainer>
            {mode === 'LIVE' && setIsPaused && (
              <PausePlayButton
                isPaused={!!isPaused}
                onToggle={() => setIsPaused((prev) => !prev)}
              />
            )}
            <LogsViewerStatusView
              loading={isPaused ? false : showLoader}
              hasNoLogs={!logs.length}
              message={statusMessage}
            />
          </Box>
        </Grid>
      </Box>
    </Stack>
  );
}

export default LogsViewer;
