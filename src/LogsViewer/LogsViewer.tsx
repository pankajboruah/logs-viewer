import { useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Grid, Box, Typography, Tooltip, Stack } from '@mui/material';
import ExpandIcon from '../assets/Expand.svg?react';
import InformationIcon from '../assets/ColorInformation.svg?react';
import LogsViewerStatusView from './LogsViewerStatusView';
import calculateTimeElapsed from '../utils/calculateTimeElapsed';
import { colors } from '../theme/colors';
import { logsViewerConstants } from './LogsViewer.constants';
import {
  StaticLogsViewerProps,
  LiveLogsViewerProps,
  LogsWithExpandContext,
  LogsWithoutExpandContext,
  HighlightKeywordsParams,
} from './LogsViewer.types';
import { logsViewerUtils } from './LogsViewer.utils';
import { editorUtils } from './Editor.utils';
import { logsViewerStyled } from './LogsViewer.styled';

const { customGuidesOptions, globalOptions, editorOptions } = logsViewerConstants;

const {
  getFocusedLineDecorators,
  getHighlightDateTextDecorations,
  getHighlightKeywordsDecorations,
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

  const keywordsHighlightDecoratorsRef = useRef<string[]>([]);
  const focusedLineDecoratorsRef = useRef<string[]>([]);
  const dateTextHighlightDecoratorsRef = useRef<string[]>([]);
  const firstLineRef = useRef<{ decorators: string[]; isLoading: boolean }>({
    decorators: [],
    isLoading: false,
  });
  const lastLineRef = useRef<{ decorators: string[]; isLoading: boolean }>({
    decorators: [],
    isLoading: false,
  });

  const isAllApplicationLogsMode = mode === 'ALL_APPLICATION_LOGS';

  const logsWithLoader = useMemo(() => {
    if (showBottomLoader) {
      return [...logs, getDummyLog(logs)];
    } else if (showTopLoader) {
      return [getDummyLog(logs), ...logs];
    }
    return logs;
  }, [logs, showBottomLoader, showTopLoader]);

  // Add an overlay widget
  const createOverlayWidget = (editorInstance: monaco.editor.IStandaloneCodeEditor) => ({
    domNode: (() => {
      const domNode = document.createElement('div');

      const root = createRoot(domNode!);
      const editorModel = editorInstance.getModel();
      let hoveredLineNumber = 1;
      root.render(
        <Tooltip title='Show surrounding logs'>
          <ExpandIcon fill={colors.overlayButtonIcon} />
        </Tooltip>
      );

      domNode.style.background = colors.overlayButtonBackground;
      domNode.style.right = '10px';
      domNode.style.top = '0px';
      domNode.style.height = '18px';
      domNode.style.width = '18px';
      domNode.style.borderRadius = '3px';
      domNode.style.display = 'flex';
      domNode.style.alignItems = 'center';
      domNode.style.justifyContent = 'center';
      domNode.style.transition = 'background-color 0.3s ease';

      // Add hover effect
      domNode.addEventListener('mouseenter', () => {
        domNode.style.background = colors.overlayButtonBackgroundHover;
      });

      // Reset background on mouse leave
      domNode.addEventListener('mouseleave', () => {
        domNode.style.background = colors.overlayButtonBackground;
      });

      domNode.addEventListener('click', () => {
        onExpandLogContextClicked?.(hoveredLineNumber);
      });

      editorInstance.onMouseMove((e) => {
        const { position } = e.target;
        if (position) {
          hoveredLineNumber = position.lineNumber;
          if (
            lastLineRef.current.isLoading &&
            editorModel &&
            hoveredLineNumber === editorModel.getLineCount()
          ) {
            domNode.style.display = 'none';
            return;
          }
          const top = editorInstance.getTopForLineNumber(position.lineNumber);
          const currentEditorTop = editorInstance.getScrollTop();
          domNode.style.display = 'flex';
          domNode.style.top = `${top - currentEditorTop}px`;
          domNode.style.cursor = 'pointer';
        }
      });

      editorInstance.onMouseLeave(() => {
        domNode.style.display = 'none';
      });

      editorInstance.onDidScrollChange(() => {
        domNode.style.display = 'none';
      });

      return domNode;
    })(),
    getId() {
      return 'my.overlay.widget';
    },
    getDomNode() {
      return this.domNode;
    },
    getPosition() {
      return null;
    },
  });

  const showFocusedLine = (
    editorInstance: monaco.editor.IStandaloneCodeEditor,
    lineNumberToFocus: number
  ) => {
    editorInstance.revealLineInCenter(lineNumberToFocus, monaco.editor.ScrollType.Immediate);
    editorInstance.setPosition({ lineNumber: lineNumberToFocus, column: 0 });
    // Setting this to true here since I want "showFocusedLine" to be called only once(when logs have rendered in the editor)
    stopScrollingToFocusedLineRef.current = true;
  };

  const handleOnEditorScrollChange = (
    editorInstance: monaco.editor.IStandaloneCodeEditor,
    e: monaco.IScrollEvent,
    prevScrollTop: number,
    updatePrevScrollTop: (newScrollTop: number) => void
  ) => {
    if (editorInstance.getValue().length === 0) {
      return;
    }

    const scrollHeight = editorInstance.getScrollHeight();
    const scrollTop = editorInstance.getScrollTop();
    const editorHeight = editorInstance.getDomNode()?.clientHeight || 0;
    const didScrollDown = e.scrollTop > prevScrollTop;
    updatePrevScrollTop(e.scrollTop); // Update the previous scroll position

    // Check if user has scrolled down by comparing with previous scroll position
    if (didScrollDown) {
      listenScrollToBottomActions.current = true;
      listenScrollToTopActions.current = true;
    }

    // hit bottom
    if (scrollTop + editorHeight >= scrollHeight) {
      if (listenScrollToBottomActions.current) {
        listenScrollToBottomActions.current = false;
        handleOnScrollBottom?.();
      }
    }
    // hit top
    else if (scrollTop === 0) {
      if (listenScrollToTopActions.current) {
        listenScrollToTopActions.current = false;
        handleOnScrollTop?.((lineNumberToScrollTo) => {
          // this callback simulates adding of logs on top of current position
          const position = editorInstance.getTopForPosition(lineNumberToScrollTo + 1.5, 0);
          editorInstance.setScrollPosition(
            { scrollTop: position },
            monaco.editor.ScrollType.Immediate
          );
        });
      }
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
      editorInstance.addOverlayWidget(createOverlayWidget(editorInstance));
    }

    if (mode === 'LIVE') {
      let prevScrollTop = 0; // Initialize with the initial scroll position

      editorInstance.onDidScrollChange((e) => {
        const didScrollUp = e.scrollTop < prevScrollTop;
        const didScrollDown = e.scrollTop > prevScrollTop;
        if (invertLogsOrder) {
          if (didScrollUp && !e.scrollHeightChanged) {
            // User scrolled upwards, so pause scrolling
            setIsPaused?.(true);
          }
        } else if (didScrollDown && !e.scrollHeightChanged) {
          // User scrolled downwards, so pause scrolling
          setIsPaused?.(true);
        }
        prevScrollTop = e.scrollTop; // Update the previous scroll position
      });

      if (editorContainerRef.current !== null) {
        const observerCallback: ResizeObserverCallback = (entries: ResizeObserverEntry[]) => {
          window.requestAnimationFrame((): void | undefined => {
            if (!Array.isArray(entries) || !entries.length) {
              return;
            }
            updateWordWrapColumn(editorInstance);
          });
        };
        const resizeObserver = new ResizeObserver(observerCallback);
        resizeObserver.observe(editorContainerRef.current);
        resizeObserverRef.current = resizeObserver;
      }
    } else {
      let prevScrollTop = 0; // Initialize with the initial scroll position

      const updatePrevScrollTop = (newScrollTop: number) => {
        prevScrollTop = newScrollTop;
      };

      editorInstance.onDidScrollChange((e) =>
        handleOnEditorScrollChange(editorInstance, e, prevScrollTop, updatePrevScrollTop)
      );
    }

    if (mode !== 'SURROUNDING_LOGS') {
      editorInstance.onMouseMove((e) => {
        const { position } = e.target;
        if (position) {
          const hoveredLineNumber = position.lineNumber;
          // highlight the hovered line
          applyFocusedLineDecorators(editorInstance, hoveredLineNumber);
        }
      });
    }

    updateViewer(editorInstance);
  };

  const highlightKeywords = ({
    editorInstance,
    matchCase = false,
  }: HighlightKeywordsParams): void => {
    if (keywords && keywords.length > 0) {
      const model = editorInstance.getModel();
      if (model) {
        const decorations: monaco.editor.IModelDeltaDecoration[] = getHighlightKeywordsDecorations(
          model,
          keywords,
          matchCase
        );
        const updatedDecorations = model.deltaDecorations(
          keywordsHighlightDecoratorsRef.current,
          decorations
        );

        keywordsHighlightDecoratorsRef.current = updatedDecorations;
      }
    }
  };

  const applyDateTextHighlightDecorators = (
    editorInstance: monaco.editor.IStandaloneCodeEditor
  ) => {
    const model = editorInstance.getModel();
    let dateTextHighlightDecorators: monaco.editor.IModelDeltaDecoration[] = [];
    if (model) {
      dateTextHighlightDecorators = getHighlightDateTextDecorations(model);
      const updatedDecorations = model.deltaDecorations(
        dateTextHighlightDecoratorsRef.current,
        dateTextHighlightDecorators
      );

      dateTextHighlightDecoratorsRef.current = updatedDecorations;
    }
  };

  const applyFocusedLineDecorators = (
    editorInstance: monaco.editor.IStandaloneCodeEditor,
    lineNumberToHighlight: number
  ) => {
    const model = editorInstance.getModel();
    let focusedLineDecorators: monaco.editor.IModelDeltaDecoration[] = [];
    if (model) {
      if (typeof lineNumberToHighlight === 'number') {
        focusedLineDecorators = getFocusedLineDecorators(model, lineNumberToHighlight);
      }
      const updatedDecorations = model.deltaDecorations(focusedLineDecoratorsRef.current, [
        ...focusedLineDecorators,
      ]);
      focusedLineDecoratorsRef.current = updatedDecorations;
    }
  };

  const updateViewer = (editorInstance: monaco.editor.IStandaloneCodeEditor) => {
    const value = generateLogText(logsWithLoader, showTimeInUTC);
    editorInstance.setValue(value);
    highlightKeywords({ editorInstance });
    applyDateTextHighlightDecorators(editorInstance);
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
      applyFocusedLineDecorators(editorInstance, focusedLineNumber);
    }
  };

  const hideLoadingLogLine = (
    editorModel: monaco.editor.ITextModel,
    direction: 'BOTTOM' | 'TOP'
  ) => {
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    let lineNumber = 1;
    let oldLineDecorations: string[] = [];
    if (direction === 'BOTTOM') {
      // last line
      lineNumber = editorModel.getLineCount();
      oldLineDecorations = lastLineRef.current.decorators;
    } else {
      // first line
      lineNumber = 1;
      oldLineDecorations = firstLineRef.current.decorators;
    }
    const lineText = editorModel.getLineContent(lineNumber);
    decorations.push(
      ...[
        {
          range: new monaco.Range(lineNumber, 1, lineNumber, lineText.length + 1),
          options: { isWholeLine: true, inlineClassName: 'transparent-background-line' },
        },
        {
          range: new monaco.Range(lineNumber, 0, lineNumber, lineText.length + 1),
          options: { isWholeLine: false, inlineClassName: 'transparent-background-text' },
        },
      ]
    );
    const updatedDecorations = editorModel.deltaDecorations(oldLineDecorations, [...decorations]);
    if (direction === 'BOTTOM') {
      lastLineRef.current.decorators = updatedDecorations;
    } else {
      firstLineRef.current.decorators = updatedDecorations;
    }
  };

  const showLoadingLogLine = (
    editorModel: monaco.editor.ITextModel,
    direction: 'BOTTOM' | 'TOP'
  ) => {
    let oldLineDecorations: string[] = [];
    if (direction === 'BOTTOM') {
      // last line
      oldLineDecorations = lastLineRef.current.decorators;
    } else {
      // first line
      oldLineDecorations = firstLineRef.current.decorators;
    }
    const updatedDecorations = editorModel.deltaDecorations(oldLineDecorations, []);
    if (direction === 'BOTTOM') {
      lastLineRef.current.decorators = updatedDecorations;
    } else {
      firstLineRef.current.decorators = updatedDecorations;
    }
  };

  const getBackgroundColor = () =>
    isAllApplicationLogsMode ? colors.backgroundAlt : colors.background;

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
        lastLineRef.current.isLoading = !!showBottomLoader;
        if (showBottomLoader) {
          hideLoadingLogLine(model, 'BOTTOM');
        } else {
          showLoadingLogLine(model, 'BOTTOM');
        }
      }
    }
  }, [showBottomLoader]);

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        firstLineRef.current.isLoading = !!showTopLoader;
        if (showTopLoader) {
          hideLoadingLogLine(model, 'TOP');
        } else {
          showLoadingLogLine(model, 'TOP');
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

  const headerComponentSection =
    headerComponent &&
    (mode === 'ALL_APPLICATION_LOGS' ? (
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 3,
          background: colors.backgroundAlt,
          width: '100%',
          paddingBottom: '16px',
        }}
      >
        {headerComponent}
      </Box>
    ) : (
      <Box>
        <Grid container height='52px'>
          {headerComponent}
        </Grid>
      </Box>
    ));

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
    <Stack height='100%' paddingBottom={mode === 'ALL_APPLICATION_LOGS' ? 2 : 0}>
      {headerComponentSection}
      <Box
        sx={{
          backgroundColor: getBackgroundColor(),
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
            <LogsViewerStatusView
              loading={isPaused ? false : showLoader}
              hasNoLogs={!logs.length}
              message={statusMessage}
              mode={mode}
            />
          </Box>
        </Grid>
      </Box>
    </Stack>
  );
}

export default LogsViewer;
