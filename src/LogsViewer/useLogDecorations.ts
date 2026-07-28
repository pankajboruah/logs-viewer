import { useRef } from 'react';
import * as monaco from 'monaco-editor';
import { editorUtils } from './Editor.utils';

const {
  getFocusedLineDecorators,
  getHighlightDateTextDecorations,
  getHighlightKeywordsDecorations,
} = editorUtils;

// Owns the Monaco decoration ids for keyword/date/focused-line highlighting and the
// shimmer placeholder shown on the log line currently being loaded (top or bottom).
function useLogDecorations() {
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

  const highlightKeywords = (
    editorInstance: monaco.editor.IStandaloneCodeEditor,
    keywords: string[] | undefined,
    matchCase = false
  ) => {
    if (keywords && keywords.length > 0) {
      const model = editorInstance.getModel();
      if (model) {
        const decorations: monaco.editor.IModelDeltaDecoration[] = getHighlightKeywordsDecorations(
          model,
          keywords,
          matchCase
        );
        keywordsHighlightDecoratorsRef.current = model.deltaDecorations(
          keywordsHighlightDecoratorsRef.current,
          decorations
        );
      }
    }
  };

  const applyDateTextHighlightDecorators = (
    editorInstance: monaco.editor.IStandaloneCodeEditor
  ) => {
    const model = editorInstance.getModel();
    if (model) {
      const dateTextHighlightDecorators = getHighlightDateTextDecorations(model);
      dateTextHighlightDecoratorsRef.current = model.deltaDecorations(
        dateTextHighlightDecoratorsRef.current,
        dateTextHighlightDecorators
      );
    }
  };

  const applyFocusedLineDecorators = (
    editorInstance: monaco.editor.IStandaloneCodeEditor,
    lineNumberToHighlight?: number
  ) => {
    const model = editorInstance.getModel();
    if (model) {
      const focusedLineDecorators: monaco.editor.IModelDeltaDecoration[] =
        typeof lineNumberToHighlight === 'number'
          ? getFocusedLineDecorators(model, lineNumberToHighlight)
          : [];
      focusedLineDecoratorsRef.current = model.deltaDecorations(focusedLineDecoratorsRef.current, [
        ...focusedLineDecorators,
      ]);
    }
  };

  // Dims the loading log line's text and shows a shimmer placeholder in its place.
  const hideLoadingLogLine = (
    editorModel: monaco.editor.ITextModel,
    direction: 'BOTTOM' | 'TOP'
  ) => {
    const lineRef = direction === 'BOTTOM' ? lastLineRef : firstLineRef;
    const lineNumber = direction === 'BOTTOM' ? editorModel.getLineCount() : 1;
    const lineText = editorModel.getLineContent(lineNumber);
    const decorations: monaco.editor.IModelDeltaDecoration[] = [
      {
        range: new monaco.Range(lineNumber, 1, lineNumber, lineText.length + 1),
        options: { isWholeLine: true, inlineClassName: 'transparent-background-line' },
      },
      {
        range: new monaco.Range(lineNumber, 0, lineNumber, lineText.length + 1),
        options: { isWholeLine: false, inlineClassName: 'transparent-background-text' },
      },
    ];
    lineRef.current.decorators = editorModel.deltaDecorations(
      lineRef.current.decorators,
      decorations
    );
    lineRef.current.isLoading = true;
  };

  // Clears the shimmer placeholder, revealing the (now loaded) log line's real text.
  const showLoadingLogLine = (
    editorModel: monaco.editor.ITextModel,
    direction: 'BOTTOM' | 'TOP'
  ) => {
    const lineRef = direction === 'BOTTOM' ? lastLineRef : firstLineRef;
    lineRef.current.decorators = editorModel.deltaDecorations(lineRef.current.decorators, []);
    lineRef.current.isLoading = false;
  };

  const isLastLineLoading = () => lastLineRef.current.isLoading;

  return {
    highlightKeywords,
    applyDateTextHighlightDecorators,
    applyFocusedLineDecorators,
    hideLoadingLogLine,
    showLoadingLogLine,
    isLastLineLoading,
  };
}

export default useLogDecorations;
