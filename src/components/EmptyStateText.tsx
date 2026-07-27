import { Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { colors } from '../theme/colors';

type Props = {
  icon?: ReactNode;
} & ({ title: string; subtitle?: string } | { title?: string; subtitle: string });

export default function EmptyStateText({ icon, title, subtitle }: Props) {
  return (
    <Stack rowGap={1} alignItems='center'>
      {icon}

      <Stack rowGap={0.5} alignItems='center'>
        {title && (
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant='body2' color={colors.textSecondary}>
            {subtitle}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
