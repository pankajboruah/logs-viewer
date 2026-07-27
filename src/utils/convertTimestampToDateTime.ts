import { getTimezoneOffsetString } from './getTimezoneOffsetString';

function convertTimestampToDateTime(timestamp: number, toUTC: boolean) {
  const date = new Date(timestamp);
  const year = String(toUTC ? date.getUTCFullYear() : date.getFullYear());
  const month = getMonthName(toUTC ? date.getUTCMonth() : date.getMonth());
  const day = prependPad2(String(toUTC ? date.getUTCDate() : date.getDate()));
  const hours = prependPad2(String(toUTC ? date.getUTCHours() : date.getHours()));
  const minutes = prependPad2(String(toUTC ? date.getUTCMinutes() : date.getMinutes()));
  const seconds = prependPad2(String(toUTC ? date.getUTCSeconds() : date.getSeconds()));

  let timezoneOffset = getTimezoneOffsetString();
  if (toUTC) {
    timezoneOffset = '+0000';
  }
  return `${month} ${day} ${year} ${hours}:${minutes}:${seconds} ${timezoneOffset}`;
}

// Function to get abbreviated month name
function getMonthName(monthIndex: number) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return months[monthIndex];
}

function prependPad2(value: string) {
  return prependPadding(value, 2, '0');
}

function prependPadding(value: string, padLength: number, padChar: string) {
  return value.padStart(padLength, padChar);
}

export default convertTimestampToDateTime;
