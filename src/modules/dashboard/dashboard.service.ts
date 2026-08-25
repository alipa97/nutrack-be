import { prisma } from '../../config/prisma.js';
import {
  calculateAge,
  calculateBmi,
  calculateTargetWaterMl,
  getBctAdvice,
  getNutritionalStatus,
} from '../../utils/bmi.js';
import { endOfDay, getWeekStartDate, startOfDay, toDateOnlyString } from '../../utils/date.js';

import { generateAllFoodGroupEvaluations } from '../../utils/foodRecommendations.js';
import { calculateStreakDays } from '../../utils/streak.js';

export const dashboardService = {
  async getSummary(userId: string, date = new Date()) {
    const targetDate = new Date(date);
    const todayStart = startOfDay(targetDate);
    const todayEnd = endOfDay(targetDate);
    const currentWeekStart = getWeekStartDate(targetDate);

    const [
      user,
      todayFoodLogs,
      todayHydrationLogs,
      latestMeasurement,
      completedChallenges,
      unlockedBadges,
      allFoodLogs,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.foodLog.findMany({
        where: { userId, loggedAt: { gte: todayStart, lte: todayEnd } },
        include: {
          foodCatalog: {
            include: { foodGroup: true },
          },
        },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.hydrationLog.findMany({
        where: { userId, loggedAt: { gte: todayStart, lte: todayEnd } },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.userMeasurementHistory.findFirst({
        where: { userId },
        orderBy: { measuredAt: 'desc' },
      }),
      prisma.userWeeklyChallenge.findMany({
        where: { userId, weekStart: currentWeekStart, isCompleted: true },
      }),
      prisma.userBadge.findMany({
        where: { userId, isUnlocked: true },
      }),
      prisma.foodLog.findMany({
        where: { userId },
        select: { loggedAt: true },
        orderBy: { loggedAt: 'desc' },
      }),
    ]);

    // Streaks
    const streakDays = calculateStreakDays(allFoodLogs.map((item) => item.loggedAt));

    // IDDS & UPF Calculations
    const consumedGroupsMap = new Map<string, { id: string; name: string; isUpf: boolean; count: number }>();
    const consumedCountsByName: Record<string, number> = {};
    let upfCount = 0;

    for (const log of todayFoodLogs) {
      const group = log.foodCatalog?.foodGroup;
      if (group) {
        const isUpf = group.name.toLowerCase().includes('upf') || group.name.toLowerCase().includes('ultra');
        if (isUpf) {
          upfCount++;
        }
        consumedCountsByName[group.name] = (consumedCountsByName[group.name] || 0) + 1;

        const existing = consumedGroupsMap.get(group.id);
        if (existing) {
          existing.count++;
        } else {
          consumedGroupsMap.set(group.id, {
            id: group.id,
            name: group.name,
            isUpf,
            count: 1,
          });
        }
      }
    }

    const consumedGroups = Array.from(consumedGroupsMap.values());
    const nonUpfGroupsCount = consumedGroups.filter((g) => !g.isUpf).length;
    const iddsScoreToday = Math.min(12, nonUpfGroupsCount);

    let iddsCategoryLabel = 'Keberagaman Pangan Tinggi';
    let iddsCategoryColor = '#10AC84'; // Green

    if (iddsScoreToday <= 3) {
      iddsCategoryLabel = 'Keberagaman Pangan Kurang';
      iddsCategoryColor = '#FF6B6B'; // Red
    } else if (iddsScoreToday <= 5) {
      iddsCategoryLabel = 'Keberagaman Pangan Sedang';
      iddsCategoryColor = '#FBBC4B'; // Orange/Yellow
    }

    const isUpfWarningActive = upfCount > 1;

    // Evaluate 13 Food Group Recommendations
    const { evaluations: foodGroupRecommendations, priorityAdvices } = generateAllFoodGroupEvaluations(
      consumedCountsByName,
      'daily'
    );

    // Profile calculations
    const profile = user?.profile;
    const age = calculateAge(profile?.birthDate);
    const currentHeight = profile?.heightCm ?? 155;
    const currentWeight = profile?.weightKg ?? 44;
    const bmi = calculateBmi(currentWeight, currentHeight);
    const nutritionalStatus = getNutritionalStatus(bmi);
    const targetWaterMl = calculateTargetWaterMl(profile?.gender ?? 'female', age.years);
    const topAdvice = priorityAdvices.length > 0 ? priorityAdvices[0] : undefined;
    const bctAdvice = getBctAdvice(nutritionalStatus.key, topAdvice);

    // Hydration calculations
    const currentWaterMl = todayHydrationLogs.reduce((sum, item) => sum + item.amountMl, 0);
    const waterRatio = targetWaterMl > 0 ? Number(Math.min(1.0, currentWaterMl / targetWaterMl).toFixed(2)) : 0;

    return {
      date: targetDate.toISOString().slice(0, 10),
      profile: profile
        ? {
            ...profile,
            ageYears: age.years,
            ageMonths: age.months,
            totalAgeMonths: age.totalMonths,
            ageFormatted: age.formatted,
            bmi,
            nutritionalStatus: nutritionalStatus.key,
            nutritionalStatusLabel: nutritionalStatus.label,
            targetWaterMl,
            bctAdvice,
          }
        : null,
      measurement: latestMeasurement,
      streakDays,
      idds: {
        scoreToday: iddsScoreToday,
        categoryLabel: iddsCategoryLabel,
        categoryColor: iddsCategoryColor,
        consumedGroupsCount: nonUpfGroupsCount,
        consumedGroups,
        upfCountToday: upfCount,
        isUpfWarningActive,
      },
      hydration: {
        currentWaterMl,
        targetWaterMl,
        waterRatio,
        isTargetAchieved: currentWaterMl >= targetWaterMl,
      },
      gamification: {
        userXpPoints: profile?.xp ?? 0,
        badgeCount: unlockedBadges.length,
        completedChallengesCount: completedChallenges.length,
      },
      foodGroupRecommendations,
      priorityAdvices,
      todayFoodLogs,
    };
  },

  async getWeeklyReport(userId: string, date = new Date()) {
    const targetDate = new Date(date);
    const weekStart = getWeekStartDate(targetDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const [user, foodLogsInWeek, hydrationLogsInWeek] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.foodLog.findMany({
        where: {
          userId,
          loggedAt: { gte: weekStart, lte: weekEnd },
        },
        include: {
          foodCatalog: {
            include: { foodGroup: true },
          },
        },
        orderBy: { loggedAt: 'asc' },
      }),
      prisma.hydrationLog.findMany({
        where: {
          userId,
          loggedAt: { gte: weekStart, lte: weekEnd },
        },
        orderBy: { loggedAt: 'asc' },
      }),
    ]);

    const profile = user?.profile;
    const age = calculateAge(profile?.birthDate);
    const targetWaterMl = calculateTargetWaterMl(profile?.gender ?? 'female', age.years);

    // Build 7-day array starting from weekStart (Monday to Sunday)
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const dailyTrends = [];
    let totalScore = 0;
    let daysWithScores = 0;

    const consumedCountsByName: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(weekStart);
      currentDay.setDate(currentDay.getDate() + i);
      const dayStart = startOfDay(currentDay);
      const dayEnd = endOfDay(currentDay);

      // Filter food logs for this day
      const dayFoods = foodLogsInWeek.filter(
        (log) => log.loggedAt >= dayStart && log.loggedAt <= dayEnd
      );

      // Distinct non-UPF groups on this day
      const dayGroupsMap = new Map<string, boolean>();
      for (const log of dayFoods) {
        const group = log.foodCatalog?.foodGroup;
        if (group) {
          const isUpf = group.name.toLowerCase().includes('upf') || group.name.toLowerCase().includes('ultra');
          if (!isUpf) {
            dayGroupsMap.set(group.id, true);
          }
          consumedCountsByName[group.name] = (consumedCountsByName[group.name] || 0) + 1;
        }
      }

      const score = Math.min(12, dayGroupsMap.size);
      if (score > 0 || dayFoods.length > 0) {
        totalScore += score;
        daysWithScores++;
      }

      // Filter hydration logs for this day
      const dayHydration = hydrationLogsInWeek.filter(
        (log) => log.loggedAt >= dayStart && log.loggedAt <= dayEnd
      );
      const water = dayHydration.reduce((sum, log) => sum + log.amountMl, 0);

      dailyTrends.push({
        date: toDateOnlyString(currentDay),
        day: dayNames[i],
        score,
        water,
        targetWater: targetWaterMl,
      });
    }

    const averageIddsScore = daysWithScores > 0 ? Number((totalScore / daysWithScores).toFixed(1)) : 0;

    let categoryLabel = 'Keberagaman Pangan Tinggi';
    let categoryDescription = 'Pola makanmu minggu ini kaya akan variasi nutrisi alami!';

    if (averageIddsScore < 4) {
      categoryLabel = 'Keberagaman Pangan Kurang';
      categoryDescription = 'Pola makanmu masih didominasi sedikit kelompok pangan. Yuk, tambah variasi sayur, buah, dan lauk segar!';
    } else if (averageIddsScore < 6) {
      categoryLabel = 'Keberagaman Pangan Sedang';
      categoryDescription = 'Keragaman panganmu sudah cukup baik, tingkatkan lagi konsumsi sayur dan buah untuk hasil maksimal!';
    }

    // Weekly evaluations for 13 food groups
    const { evaluations: foodGroupRecommendations } = generateAllFoodGroupEvaluations(
      consumedCountsByName,
      'weekly'
    );

    return {
      weekStartDate: toDateOnlyString(weekStart),
      weekEndDate: toDateOnlyString(weekEnd),
      averageIddsScore,
      categoryLabel,
      categoryDescription,
      dailyTrends,
      foodGroupRecommendations,
      targetWaterMl,
    };
  },
};