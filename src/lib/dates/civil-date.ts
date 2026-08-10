/** Data civil sem conversao por UTC, para nao deslocar o dia em fusos negativos. */
export function todayCivil(now = new Date()): string {
  return formatCivil(now);
}

export function addCivilDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days, 12);
  return formatCivil(value);
}

export function formatCivilDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, 12));
}

function formatCivil(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
