const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function padTwoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date): string {
  if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value)) {
    return value;
  }

  const date = toDate(value);
  if (!date) {
    return '-';
  }

  const year = date.getFullYear();
  const month = padTwoDigits(date.getMonth() + 1);
  const day = padTwoDigits(date.getDate());

  return `${year}-${month}-${day}`;
}

export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  if (!date) {
    return '-';
  }

  return `${formatDate(value)} ${timeFormatter.format(date)}`;
}
