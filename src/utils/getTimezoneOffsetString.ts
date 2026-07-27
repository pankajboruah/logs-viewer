import { format } from 'date-fns';

export function getTimezoneOffsetString(): string {
  const offsetString = format(new Date(), 'XX');
  return offsetString;
}
