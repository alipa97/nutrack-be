export const startOfDay = (date = new Date()): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date = new Date()): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const toDateOnlyString = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Returns Monday (00:00:00) of the current week for weekly challenges
 */
export const getWeekStartDate = (date = new Date()): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = (day === 0 ? -6 : 1) - day;
  result.setDate(result.getDate() + diff);
  return result;
};