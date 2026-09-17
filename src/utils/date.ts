const JAKARTA_TZ = 'Asia/Jakarta';

/**
 * Returns YYYY-MM-DD string in Asia/Jakarta (WIB) timezone
 */
export const toDateOnlyString = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

/**
 * Returns a Date representing 00:00:00.000 WIB (Asia/Jakarta, UTC+7) for the given date
 */
export const startOfDay = (date = new Date()): Date => {
  const dateStr = toDateOnlyString(date);
  return new Date(`${dateStr}T00:00:00.000+07:00`);
};

/**
 * Returns a Date representing 23:59:59.999 WIB (Asia/Jakarta, UTC+7) for the given date
 */
export const endOfDay = (date = new Date()): Date => {
  const dateStr = toDateOnlyString(date);
  return new Date(`${dateStr}T23:59:59.999+07:00`);
};

/**
 * Returns Sunday (00:00:00.000 WIB) of the current week for weekly reports & challenges.
 * Week starts on Sunday and ends on Saturday.
 */
export const getWeekStartDate = (date = new Date()): Date => {
  const result = startOfDay(date);
  const day = result.getDay(); // 0 is Sunday, 1 is Monday... 6 is Saturday
  result.setDate(result.getDate() - day);
  return result;
};

/**
 * Returns Saturday (23:59:59.999 WIB) of the current week.
 */
export const getWeekEndDate = (date = new Date()): Date => {
  const sunday = getWeekStartDate(date);
  const saturday = new Date(sunday.getTime());
  saturday.setDate(saturday.getDate() + 6);
  return endOfDay(saturday);
};