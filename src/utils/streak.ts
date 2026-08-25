import { toDateOnlyString } from './date.js';

export const calculateStreakDays = (dates: Date[]): number => {
  if (dates.length === 0) return 0;

  const uniqueDates = [...new Set(dates.map((date) => toDateOnlyString(date)))].sort().reverse();
  const today = new Date();
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);

  let streak = 0;

  for (const dateText of uniqueDates) {
    const candidate = new Date(`${dateText}T00:00:00.000Z`);
    const expected = new Date(current);
    expected.setUTCDate(expected.getUTCDate() - streak);

    if (toDateOnlyString(candidate) !== toDateOnlyString(expected)) {
      break;
    }

    streak += 1;
  }

  return streak;
};