import { LogEntry } from './LogsViewer.types';
import convertTimestampToDateTime from '../utils/convertTimestampToDateTime';

function generateLogs(logs: LogEntry[], showTimeInUTC: boolean): string[] {
  return logs.map((log) => {
    const timestamp = convertTimestampToDateTime(log.timestamp, showTimeInUTC);
    return `${timestamp} ${log.appName ? `| ${log.appName} ` : ''}| ${removeAnsiCodes(log.message)}`;
  });
}

function generateLogText(logs: LogEntry[], showTimeInUTC: boolean): string {
  return generateLogs(logs, showTimeInUTC).join('\n');
}

function removeAnsiCodes(text: string): string {
  // Remove ANSI escape codes using a regular expression
  // eslint-disable-next-line no-control-regex
  const textWithoutAnsiCharacters = text.replace(/\[[0-9;]*m/g, '');
  return textWithoutAnsiCharacters;
}

const getDummyLog = (logs: LogEntry[], includeAppName = false): LogEntry => {
  const lastLog = logs[logs.length - 1];
  return {
    timestamp: lastLog?.timestamp ?? Date.now(),
    nanos: lastLog?.nanos ?? Date.now(),
    message: '',
    ...(includeAppName ? { appName: lastLog?.appName ?? '' } : {}),
  };
};

export const logsViewerUtils = {
  generateLogs,
  generateLogText,
  getDummyLog,
};
