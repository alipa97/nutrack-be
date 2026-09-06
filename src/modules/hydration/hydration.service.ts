import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { calculateAge, calculateTargetWaterMl } from '../../utils/bmi.js';
import { endOfDay, startOfDay } from '../../utils/date.js';
import { gamificationService } from '../gamification/gamification.service.js';

export const hydrationService = {
  async list(userId: string, date?: string | Date) {
    const where: Prisma.HydrationLogWhereInput = { userId };
    if (date) {
      const d = new Date(date);
      where.loggedAt = {
        gte: startOfDay(d),
        lte: endOfDay(d),
      };
    }

    return prisma.hydrationLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' },
    });
  },

  async create(userId: string, amountMl: number) {
    const todayStart = startOfDay();
    const todayEnd = endOfDay();

    // Get current profile and today's existing total
    const [profile, existingLogs] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.hydrationLog.findMany({
        where: { userId, loggedAt: { gte: todayStart, lte: todayEnd } },
      }),
    ]);

    // Only count logs AFTER the last reset (if any reset happened today)
    const resetAt = profile?.lastHydrationResetAt;
    const effectiveStart = resetAt && resetAt >= todayStart ? resetAt : todayStart;
    const activeLogs = existingLogs.filter((l) => l.loggedAt >= effectiveStart);
    const previousTotal = activeLogs.reduce((sum, item) => sum + item.amountMl, 0);
    const newTotal = previousTotal + amountMl;

    const age = calculateAge(profile?.birthDate);
    const targetWaterMl = calculateTargetWaterMl(profile?.gender ?? 'female', age.years);

    const log = await prisma.hydrationLog.create({
      data: {
        userId,
        amountMl,
        loggedAt: new Date(),
      },
    });


    // Evaluate gamification weekly challenges asynchronously
    gamificationService.evaluateWeeklyChallenges(userId).catch((err) => {
      console.error('Failed to evaluate gamification challenges on water log:', err);
    });

    return {
      log,
      currentWaterMl: newTotal,
      targetWaterMl,
      waterRatio: targetWaterMl > 0 ? Math.min(1.0, newTotal / targetWaterMl) : 0,
      xpAwarded: 0,
    };
  },

  async dailyTotal(userId: string, date = new Date()) {
    const targetDate = new Date(date);
    const todayStart = startOfDay(targetDate);
    const todayEnd = endOfDay(targetDate);

    const [profile, logs] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.hydrationLog.findMany({
        where: { userId, loggedAt: { gte: todayStart, lte: todayEnd } },
      }),
    ]);

    // Only count logs AFTER the last reset (if any reset happened today)
    const resetAt = profile?.lastHydrationResetAt;
    const effectiveStart = resetAt && resetAt >= todayStart ? resetAt : todayStart;
    const activeLogs = logs.filter((l) => l.loggedAt >= effectiveStart);
    const totalMl = activeLogs.reduce((sum, item) => sum + item.amountMl, 0);

    const age = calculateAge(profile?.birthDate);
    const targetWaterMl = calculateTargetWaterMl(profile?.gender ?? 'female', age.years);
    const waterRatio = targetWaterMl > 0 ? Number(Math.min(1.0, totalMl / targetWaterMl).toFixed(2)) : 0;

    return {
      date: targetDate.toISOString().slice(0, 10),
      totalWaterMl: totalMl,
      targetWaterMl,
      waterRatio,
      isTargetAchieved: totalMl >= targetWaterMl,
      logsCount: activeLogs.length,
      allLogsCount: logs.length,
    };
  },

  /**
   * Soft reset: Sets lastHydrationResetAt to now() so the progress bar
   * resets to 0, but all previous hydration logs are PRESERVED in the database.
   */
  async resetToday(userId: string) {
    const now = new Date();

    await prisma.userProfile.update({
      where: { userId },
      data: { lastHydrationResetAt: now },
    });

    return { message: 'Hydration reset for today (logs preserved)', currentWaterMl: 0 };
  },
};