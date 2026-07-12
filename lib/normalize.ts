/** Trim and collapse internal whitespace for stable label matching (faculty / names). */
export function normLabel(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}
