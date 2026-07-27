import { intervalToDuration } from 'date-fns';

export default function calculateTimeElapsed(
  timestamp: number,
  showSeconds = true,
  expanded = false
) {
  const duration = intervalToDuration({ start: timestamp, end: Date.now() });

  const units = [
    { value: duration.years || 0, label: expanded ? ' year' : 'y' },
    { value: duration.months || 0, label: expanded ? ' month' : 'mo' },
    { value: duration.days || 0, label: expanded ? ' day' : 'd' },
    { value: duration.hours || 0, label: expanded ? ' hour' : 'h' },
    { value: duration.minutes || 0, label: expanded ? ' minute' : 'min' },
  ];

  if (showSeconds) {
    units.push({ value: duration.seconds || 0, label: expanded ? ' second' : 's' });
  }

  const formattedDate = units
    .filter((unit) => unit.value !== 0)
    .slice(0, 2)
    .map((unit) => {
      if (expanded) {
        return `${unit.value}${unit.label}${unit.value > 1 ? 's' : ''}`;
      } else {
        return `${unit.value}${unit.label}`;
      }
    })
    .join(' ');

  return formattedDate;
}
