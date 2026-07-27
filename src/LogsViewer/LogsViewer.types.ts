import * as monaco from 'monaco-editor';
import { ReactNode } from 'react';

export interface LogEntry {
  appName?: string;
  timestamp: number;
  nanos: number;
  message: string;
}

export interface StaticLogsViewerProps extends LogsViewerProps {
  handleOnScrollBottom?: () => void;
  handleOnScrollTop?: (scrollToLineNumberCB: (lineNumberToScrollTo: number) => void) => void;
  isPaused?: never;
  keywords: string[];
  mode?: 'STATIC' | 'SURROUNDING_LOGS' | 'ALL_APPLICATION_LOGS';
  setIsPaused?: never;
}

export interface LiveLogsViewerProps extends LogsViewerProps {
  handleOnScrollBottom?: never;
  handleOnScrollTop?: never;
  isPaused: boolean;
  keywords: string[];
  mode: 'LIVE';
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface LogsWithoutExpandContext extends LogsViewerProps {
  showExpandLogContext?: false;
  onExpandLogContextClicked?: never;
}

export interface LogsWithExpandContext extends LogsViewerProps {
  showExpandLogContext: true;
  onExpandLogContextClicked: (lineNumber: number) => void;
}

export interface LogsViewerProps {
  containerHeight?: number;
  focusedLineNumber?: number | null;
  headerComponent?: React.ReactNode;
  infoText?: string;
  invertLogsOrder?: boolean;
  logs: LogEntry[];
  noLogsForLongInfo?: { showInfo: boolean; latestLogTimestampInMilliseconds: number };
  refreshToggled?: boolean;
  showBottomLoader?: boolean;
  showLineNumbers?: boolean;
  showLoader?: boolean;
  showTimeInUTC?: boolean;
  showTopLoader?: boolean;
  statusMessage?: ReactNode;
  topLogsAddedCount?: number;
}

export interface SearchAndHighlightParams {
  matchCase?: boolean;
  reverse?: boolean;
}

export interface HighlightKeywordsParams {
  editorInstance: monaco.editor.IStandaloneCodeEditor;
  matchCase?: boolean;
}
