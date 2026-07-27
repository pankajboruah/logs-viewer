export function regexEscapeChars(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
