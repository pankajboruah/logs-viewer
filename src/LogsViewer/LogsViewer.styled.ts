import styled from '@emotion/styled';
import { Theme } from '@mui/material';
import { SxProps, Box } from '@mui/system';
import { colors } from '../theme/colors';

const pausePlayButtonStyle: SxProps<Theme> = {
  color: (theme) => theme.palette.common.white,
  height: '24px',
  width: '24px',
  padding: '4px',
};

const StyledEditorContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'editorWidth',
})(
  ({ editorWidth }: { editorWidth: number }) => `
  .custom-date-highlight {
    color: ${colors.textMuted};
  }
  .custom-keyword-highlight {
    background-color: ${colors.keywordHighlightBackground};
    box-shadow: 2px 0px ${colors.keywordHighlightBackground}, -2px 0px ${colors.keywordHighlightBackground};
  }
  .gray-background-line {
    background-color: ${colors.focusedLineBackground};
  }
  .gray-background-text {
    color: ${colors.focusedLineText};
  }
  .transparent-background-line {
    border-radius: 4px;
    display: block;
    background-color: ${colors.shimmerBackground};
    padding-right: 10px;
    margin-right: 10px;
    // subtracting padding and margin widths
    width: calc(${editorWidth}px - 20px);
  }
  .transparent-background-line::after {
    border-radius: 4px;
    animation: animation-wiooy9 1s linear 0s infinite;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
    content: '';
    position: absolute;
    -webkit-transform: translateX(-100%);
    -moz-transform: translateX(-100%);
    -ms-transform: translateX(-100%);
    transform: translateX(-100%);
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
  }
  .transparent-background-text {
    color: transparent;
  }
  .monaco-editor-overlaymessage {
    display: none !important;
  }
  >section {
    flex: 1;
  }
`
);

const StyledBoxContainer = styled(Box)(({
  isAllApplicationLogsMode,
}: {
  isAllApplicationLogsMode?: boolean;
}) => {
  const backgroundColor = isAllApplicationLogsMode ? colors.backgroundAlt : colors.background;

  return `
      position: absolute;
      height: 100%;
      width: 100%;
      background: ${backgroundColor};
      display: flex;
      justify-content: center;
      align-items: center;
    `;
});

const StyledBoxContent = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
`;

export const logsViewerStyled = {
  pausePlayButtonStyle,
  StyledEditorContainer,
  StyledBoxContainer,
  StyledBoxContent,
};
