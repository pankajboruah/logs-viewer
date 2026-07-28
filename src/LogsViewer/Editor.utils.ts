import { MutableRefObject } from 'react';
import * as monaco from 'monaco-editor';
import { LogEntry } from './LogsViewer.types';
import { regexEscapeChars } from '../utils/regex';

// Update the wordWrapColumn based on the gap and font width
function updateWordWrapColumn(editor: monaco.editor.IStandaloneCodeEditor) {
  const availableColumnWidth = editor.getLayoutInfo().viewportColumn; // The number of columns (of typical characters) fitting on a viewport line.

  // Update the Monaco Editor's options with the new wordWrapColumn value
  editor.updateOptions({
    wordWrap: 'bounded',
    wordWrapColumn: availableColumnWidth,
  });
}

const getFocusedLineDecorators = (editorModel: monaco.editor.ITextModel, lineNumber: number) => {
  const decorations: monaco.editor.IModelDeltaDecoration[] = [];
  const lineText = editorModel.getLineContent(lineNumber);
  decorations.push(
    ...[
      {
        range: new monaco.Range(lineNumber, 1, lineNumber, lineText.length + 1),
        options: { isWholeLine: true, inlineClassName: 'gray-background-line' },
      },
      {
        range: new monaco.Range(lineNumber, 0, lineNumber, lineText.length + 1),
        options: { isWholeLine: false, inlineClassName: 'gray-background-text' },
      },
    ]
  );
  return decorations;
};

const getHighlightDateTextDecorations = (editorModel: monaco.editor.ITextModel) => {
  const decorations: monaco.editor.IModelDeltaDecoration[] = [];
  for (let lineNumber = 1; lineNumber <= editorModel.getLineCount(); lineNumber += 1) {
    decorations.push({
      range: new monaco.Range(lineNumber, 0, lineNumber, 28),
      options: { inlineClassName: 'custom-date-highlight' },
    });
  }
  return decorations;
};

const getHighlightKeywordsDecorations = (
  editorModel: monaco.editor.ITextModel,
  keywords: string[],
  matchCase = false
) => {
  const decorations: monaco.editor.IModelDeltaDecoration[] = [];
  const escapedKeywords = keywords.map(regexEscapeChars);
  for (let lineNumber = 1; lineNumber <= editorModel.getLineCount(); lineNumber += 1) {
    const lineText = editorModel.getLineContent(lineNumber);

    // Find matches for keywords within the line
    const keywordFlags = matchCase ? '' : 'i';
    const keywordRegex = new RegExp(`(${escapedKeywords.join('|')})`, `g${keywordFlags}`);
    let match;
    while ((match = keywordRegex.exec(lineText)) !== null) {
      const startColumn = match.index + 1;
      const endColumn = startColumn + match[0].length;

      decorations.push({
        range: new monaco.Range(lineNumber, startColumn, lineNumber, endColumn),
        options: { inlineClassName: 'custom-keyword-highlight' },
      });
    }
  }
  return decorations;
};

const scrollToLog = ({
  editor,
  logLineNumber,
}: {
  editor: monaco.editor.IStandaloneCodeEditor;
  logLineNumber: number;
}) => {
  const model = editor.getModel();
  if (model) {
    editor.revealLineInCenterIfOutsideViewport(logLineNumber, monaco.editor.ScrollType.Smooth);
  }
};

const scrollToTopMostLog = ({
  editor,
  logs,
}: {
  editor: monaco.editor.IStandaloneCodeEditor;
  logs: LogEntry[];
}) => {
  if (logs.length > 0) {
    scrollToLog({ editor, logLineNumber: 1 });
  }
};

const scrollToBottomMostLog = ({
  editor,
  logs,
}: {
  editor: monaco.editor.IStandaloneCodeEditor;
  logs: LogEntry[];
}) => {
  const model = editor.getModel();
  if (model && logs.length > 0) {
    const modelLineCount = model.getLineCount();
    scrollToLog({ editor, logLineNumber: modelLineCount });
  }
};

// Builds a STATIC/SURROUNDING_LOGS scroll handler that triggers infinite-scroll
// pagination callbacks when the user reaches the top or bottom of the editor.
function createPaginationScrollHandler({
  handleOnScrollBottom,
  handleOnScrollTop,
  listenScrollToTopActionsRef,
  listenScrollToBottomActionsRef,
}: {
  handleOnScrollBottom?: () => void;
  handleOnScrollTop?: (scrollToLineNumberCB: (lineNumberToScrollTo: number) => void) => void;
  listenScrollToTopActionsRef: MutableRefObject<boolean>;
  listenScrollToBottomActionsRef: MutableRefObject<boolean>;
}) {
  let prevScrollTop = 0;

  return (editorInstance: monaco.editor.IStandaloneCodeEditor, e: monaco.IScrollEvent) => {
    if (editorInstance.getValue().length === 0) {
      return;
    }

    const scrollHeight = editorInstance.getScrollHeight();
    const scrollTop = editorInstance.getScrollTop();
    const editorHeight = editorInstance.getDomNode()?.clientHeight || 0;
    const didScrollDown = e.scrollTop > prevScrollTop;
    prevScrollTop = e.scrollTop;

    // Check if user has scrolled down by comparing with previous scroll position
    if (didScrollDown) {
      listenScrollToBottomActionsRef.current = true;
      listenScrollToTopActionsRef.current = true;
    }

    // hit bottom
    if (scrollTop + editorHeight >= scrollHeight) {
      if (listenScrollToBottomActionsRef.current) {
        listenScrollToBottomActionsRef.current = false;
        handleOnScrollBottom?.();
      }
    }
    // hit top
    else if (scrollTop === 0) {
      if (listenScrollToTopActionsRef.current) {
        listenScrollToTopActionsRef.current = false;
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
}

// Builds a LIVE-mode scroll handler that pauses the tail once the user scrolls away
// from the live edge (bottom when invertLogsOrder, top otherwise).
function createLiveTailPauseHandler({
  invertLogsOrder,
  onUserScroll,
}: {
  invertLogsOrder: boolean;
  onUserScroll: () => void;
}) {
  let prevScrollTop = 0;

  return (e: monaco.IScrollEvent) => {
    const didScrollUp = e.scrollTop < prevScrollTop;
    const didScrollDown = e.scrollTop > prevScrollTop;
    const scrolledAwayFromLiveEdge = invertLogsOrder ? didScrollUp : didScrollDown;

    if (scrolledAwayFromLiveEdge && !e.scrollHeightChanged) {
      onUserScroll();
    }
    prevScrollTop = e.scrollTop;
  };
}

// Keeps the editor's word-wrap column in sync with the container width as it resizes.
function attachWordWrapResizeObserver(
  editorInstance: monaco.editor.IStandaloneCodeEditor,
  containerEl: HTMLElement,
  resizeObserverRef: MutableRefObject<ResizeObserver | null>
) {
  resizeObserverRef.current?.disconnect();
  const observerCallback: ResizeObserverCallback = (entries: ResizeObserverEntry[]) => {
    window.requestAnimationFrame((): void | undefined => {
      if (!Array.isArray(entries) || !entries.length) {
        return;
      }
      updateWordWrapColumn(editorInstance);
    });
  };
  const resizeObserver = new ResizeObserver(observerCallback);
  resizeObserver.observe(containerEl);
  resizeObserverRef.current = resizeObserver;
}

export const editorUtils = {
  attachWordWrapResizeObserver,
  createLiveTailPauseHandler,
  createPaginationScrollHandler,
  getFocusedLineDecorators,
  getHighlightDateTextDecorations,
  getHighlightKeywordsDecorations,
  scrollToBottomMostLog,
  scrollToTopMostLog,
  updateWordWrapColumn,
};
