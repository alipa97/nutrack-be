import { toDateOnlyString } from './date.js';

/**
 * Calculates personal food log streak (consecutive days of logging food).
 * If user has not logged today yet, streak is maintained from yesterday.
 * If user missed yesterday, streak resets to 0.
 */
export const calculateStreakDays = (dates: Date[], baseDate = new Date()): number => {
  if (dates.length === 0) return 0;

  const dateSet = new Set(dates.map((date) => toDateOnlyString(date)));
  const todayStr = toDateOnlyString(baseDate);

  const yesterday = new Date(baseDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateOnlyString(yesterday);

  let startDate: Date;
  if (dateSet.has(todayStr)) {
    startDate = new Date(baseDate);
  } else if (dateSet.has(yesterdayStr)) {
    startDate = new Date(yesterday);
  } else {
    // Missed yesterday -> streak resets to 0
    return 0;
  }

  let streak = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  while (true) {
    const checkDate = new Date(current);
    checkDate.setDate(checkDate.getDate() - streak);
    const checkStr = toDateOnlyString(checkDate);

    if (dateSet.has(checkStr)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

export type PartnerStreakResult = {
  streakDays: number;
  isStreakLitToday: boolean;
  myScannedToday: boolean;
  partnerScannedToday: boolean;
};

/**
 * Calculates mutual partner streak between two users.
 * Rules:
 * 1. A day is counted towards streak ONLY IF BOTH users logged food on that day.
 * 2. If both scanned today: streak is lit (isStreakLitToday = true) and increments.
 * 3. If they have not both scanned today yet:
 *    - If both scanned yesterday: streak from yesterday is preserved, but flame is unlit today.
 *    - If yesterday was missed by either user or both: streak RESETS TO 0!
 */
export const calculatePartnerStreak = (
  userDates: Date[],
  partnerDates: Date[],
  baseDate = new Date()
): PartnerStreakResult => {
  const userSet = new Set(userDates.map((d) => toDateOnlyString(d)));
  const partnerSet = new Set(partnerDates.map((d) => toDateOnlyString(d)));

  const todayStr = toDateOnlyString(baseDate);
  const yesterday = new Date(baseDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateOnlyString(yesterday);

  const myScannedToday = userSet.has(todayStr);
  const partnerScannedToday = partnerSet.has(todayStr);
  const isStreakLitToday = myScannedToday && partnerScannedToday;

  const isMutualScan = (dateStr: string) => userSet.has(dateStr) && partnerSet.has(dateStr);

  let streakDays = 0;

  if (isStreakLitToday) {
    // Both scanned today: count starts from today and goes back consecutively
    streakDays = 1;
    let daysBack = 1;
    while (true) {
      const checkDate = new Date(baseDate);
      checkDate.setDate(checkDate.getDate() - daysBack);
      const checkStr = toDateOnlyString(checkDate);
      if (isMutualScan(checkStr)) {
        streakDays += 1;
        daysBack += 1;
      } else {
        break;
      }
    }
  } else {
    // Has not both scanned today yet
    if (isMutualScan(yesterdayStr)) {
      // Both scanned yesterday, so yesterday's streak is preserved today until midnight
      streakDays = 1;
      let daysBack = 2;
      while (true) {
        const checkDate = new Date(baseDate);
        checkDate.setDate(checkDate.getDate() - daysBack);
        const checkStr = toDateOnlyString(checkDate);
        if (isMutualScan(checkStr)) {
          streakDays += 1;
          daysBack += 1;
        } else {
          break;
        }
      }
    } else {
      // Yesterday was missed (neither or only one scanned yesterday) -> RESETS TO 0
      streakDays = 0;
    }
  }

  return {
    streakDays,
    isStreakLitToday,
    myScannedToday,
    partnerScannedToday,
  };
};