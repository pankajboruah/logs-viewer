import * as monaco from 'monaco-editor';
import { createRoot } from 'react-dom/client';
import { Tooltip } from '@mui/material';
import ExpandIcon from '../assets/Expand.svg?react';
import { colors } from '../theme/colors';

// Builds the hover-only "show surrounding logs" overlay widget rendered on top of the editor.
function createExpandOverlayWidget({
  editorInstance,
  isLastLineLoading,
  onExpandLogContextClicked,
}: {
  editorInstance: monaco.editor.IStandaloneCodeEditor;
  isLastLineLoading: () => boolean;
  onExpandLogContextClicked?: (lineNumber: number) => void;
}): monaco.editor.IOverlayWidget {
  const domNode = document.createElement('div');

  const root = createRoot(domNode);
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
      if (isLastLineLoading() && editorModel && hoveredLineNumber === editorModel.getLineCount()) {
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

  return {
    getId: () => 'my.overlay.widget',
    getDomNode: () => domNode,
    getPosition: () => null,
  };
}

export default createExpandOverlayWidget;
