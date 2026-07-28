import { IconButton, Tooltip } from '@mui/material';
import PauseCircleIcon from '../assets/PauseCircle.svg?react';
import PlayCircleIcon from '../assets/PlayCircle.svg?react';
import { colors } from '../theme/colors';

function PausePlayButton({ isPaused, onToggle }: { isPaused: boolean; onToggle: () => void }) {
  return (
    <Tooltip title={isPaused ? 'Resume live tail' : 'Pause live tail'}>
      <IconButton
        onClick={onToggle}
        sx={{
          position: 'absolute',
          top: '10px',
          right: '50px',
          zIndex: 10,
          height: '28px',
          width: '28px',
          padding: '4px',
          background: colors.overlayButtonBackground,
          '&:hover': {
            background: colors.overlayButtonBackgroundHover,
          },
        }}
      >
        {isPaused ? (
          <PlayCircleIcon fill={colors.overlayButtonIcon} />
        ) : (
          <PauseCircleIcon fill={colors.overlayButtonIcon} />
        )}
      </IconButton>
    </Tooltip>
  );
}

export default PausePlayButton;
