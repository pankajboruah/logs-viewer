import * as monaco from 'monaco-editor';

const customGuidesOptions: monaco.editor.IGuidesOptions = {
  indentation: false,
};

const globalOptions = (): monaco.editor.IGlobalEditorOptions => ({
  theme: 'vs-dark',
  tabSize: 0,
  detectIndentation: false,
});

const editorOptions = (): monaco.editor.IEditorOptions => ({
  minimap: {
    enabled: false,
  },
  smoothScrolling: true,
  lineHeight: 20,
  readOnly: true,
  selectionHighlight: false,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  wordWrapColumn: 200,
  wrappingIndent: 'none',
  fontFamily: 'Roboto Mono',
  fontSize: 13,
  fontWeight: '400',
  letterSpacing: -0.14,
});

export const logsViewerConstants = {
  customGuidesOptions,
  editorOptions,
  globalOptions,
};
