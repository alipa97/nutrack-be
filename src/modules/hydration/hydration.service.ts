import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { calculateAge, calculateTargetWaterMl } from '../../utils/bmi.js';
import { endOfDay, startOfDay } from '../../utils/date.js';

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

    const previousTotal = existingLogs.reduce((sum, item) => sum + item.amountMl, 0);
    const newTotal = previousTotal + amountMl;

    const age = calculateAge(profile?.birthDate);
    const targetWaterMl = calculateTargetWaterMl(profile?.gender ?? 'female', age.years);

    // Award +20 XP if this log causes user to hit the AKG target for the first time today
    const shouldAwardXp = previousTotal < targetWaterMl && newTotal >= targetWaterMl;

    const [log] = await prisma.$transaction([
      prisma.hydrationLog.create({
        data: {
          userId,
          amountMl,
          loggedAt: new Date(),
        },
      }),
      ...(shouldAwardXp
        ? [
            prisma.userProfile.updateMany({
              where: { userId },
              data: { xp: { increment: 20 } },
            }),
          ]
        : []),
    ]);


    return {
      log,
      currentWaterMl: newTotal,
      targetWaterMl,
      waterRatio: targetWaterMl > 0 ? Math.min(1.0, newTotal / targetWaterMl) : 0,
      xpAwarded: shouldAwardXp ? 20 : 0,
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

    const totalMl = logs.reduce((sum, item) => sum + item.amountMl, 0);
    const age = calculateAge(profile?.birthDate);
    const targetWaterMl = calculateTargetWaterMl(profile?.gender ?? 'female', age.years);
    const waterRatio = targetWaterMl > 0 ? Number(Math.min(1.0, totalMl / targetWaterMl).toFixed(2)) : 0;

    return {
      date: targetDate.toISOString().slice(0, 10),
      totalWaterMl: totalMl,
      targetWaterMl,
      waterRatio,
      isTargetAchieved: totalMl >= targetWaterMl,
      logsCount: logs.length,
    };
  },

  async resetToday(userId: string) {
    const todayStart = startOfDay();
    const todayEnd = endOfDay();

    await prisma.hydrationLog.deleteMany({
      where: { userId, loggedAt: { gte: todayStart, lte: todayEnd } },
    });

    return { message: 'Hydration reset for today', currentWaterMl: 0 };
  },
};