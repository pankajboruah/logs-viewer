# logs-viewer

A React log viewer built on [Monaco Editor](https://microsoft.github.io/monaco-editor/), styled with Monaco's built-in `vs-dark` theme. Renders large lists of log lines with search highlighting, infinite scroll, and a per-line "show surrounding logs" action.

## Features

- **Infinite scroll** — fires callbacks when the user scrolls to the bottom or top of the log list, so a parent component can fetch and append/prepend more logs. Guarded against firing on programmatic (non-user) scroll events.
- **Loading line** — while more logs are being fetched, a shimmering placeholder line is rendered at the edge being loaded, then swapped for real content.
- **Search highlighting** — keyword matches are highlighted inline (with optional case sensitivity), timestamps are dimmed, and the currently hovered line is highlighted, all via Monaco `deltaDecorations`.
- **Per-line "expand context" action** — hovering a line reveals a floating action button (a single repositioning Monaco overlay widget) that triggers a callback with the hovered line number, so a consumer can open a "surrounding logs" view.
- **Live-tail mode** — a `LIVE` mode that auto-scrolls to follow new logs and pauses when the user manually scrolls.

## Install

```sh
npm install logs-viewer
```

Peer dependencies: `react`, `react-dom`, `@mui/material`, `@mui/system`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `monaco-editor`, `@monaco-editor/react`.

## Usage

```tsx
import { LogsViewer } from 'logs-viewer';

<LogsViewer
  mode='STATIC'
  logs={logs}
  keywords={['error']}
  showLoader={isLoading}
  showBottomLoader={isFetchingMore}
  handleOnScrollBottom={fetchMoreLogs}
  showExpandLogContext
  onExpandLogContextClicked={(lineNumber) => openSurroundingLogs(lineNumber)}
/>;
```

See `LogsViewer.types.ts` for the full discriminated-union prop API (`STATIC`/`SURROUNDING_LOGS` modes vs. `LIVE` mode, and the `showExpandLogContext` variants).

## Development

```sh
npm install
npm run dev       # demo app at http://localhost:5173
npm run typecheck
npm run lint
npm run build:lib  # library build -> dist/
npm run build:demo # demo app build -> dist-demo/
```

The demo app (`src/demo/`) exercises every feature above with generated mock log data — mode switching, simulated load-more/pagination, live-tail, keyword search, and the expand-context flow (opened in a modal, mirroring how a real consumer would wire it up).
