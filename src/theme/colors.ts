// A small, flat dark-UI palette tuned for contrast against Monaco's built-in
// `vs-dark` editor background (#1e1e1e), used for everything around the
// editor itself (containers, overlay widget, decorations, status views).
export const colors = {
  background: '#1e1e1e',
  backgroundAlt: '#252526',
  border: '#3c3c3c',

  textPrimary: '#d4d4d4',
  textSecondary: '#9d9d9d',
  textMuted: '#6e7681',

  overlayButtonBackground: '#3c3c3c',
  overlayButtonBackgroundHover: '#4a4a4a',
  overlayButtonIcon: '#ffffff',

  focusedLineBackground: '#2a2d2e',
  focusedLineText: '#ffffff',

  shimmerBackground: '#2a2a2a',
  keywordHighlightBackground: '#5a4a1a',

  accent: '#9d7bea',
} as const;
