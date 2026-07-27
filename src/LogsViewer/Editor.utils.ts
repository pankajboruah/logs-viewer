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

export const editorUtils = {
  getFocusedLineDecorators,
  getHighlightDateTextDecorations,
  getHighlightKeywordsDecorations,
  scrollToBottomMostLog,
  scrollToTopMostLog,
  updateWordWrapColumn,
};
