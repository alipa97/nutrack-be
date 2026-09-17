import { prisma } from '../../config/prisma.js';
import {
  calculateAge,
  calculateBmi,
  calculateTargetWaterMl,
  getBctAdvice,
  getNutritionalStatus,
} from '../../utils/bmi.js';
import { endOfDay, getWeekEndDate, getWeekStartDate, startOfDay, toDateOnlyString } from '../../utils/date.js';

import { extractFoodGroupsFromLog, generateAllFoodGroupEvaluations, findRecommendationConfig } from '../../utils/foodRecommendations.js';
import { calculatePartnerStreak, calculateStreakDays } from '../../utils/streak.js';

export const dashboardService = {
  async getSummary(userId: string, date = new Date()) {
    const targetDate = new Date(date);
    const todayStart = startOfDay(targetDate);
    const todayEnd = endOfDay(targetDate);
    const currentWeekStart = getWeekStartDate(targetDate);

    const rolling7DaysStart = startOfDay(new Date(targetDate.getTime() - 6 * 24 * 60 * 60 * 1000));

    const [
      user,
      todayFoodLogs,
      todayHydrationLogs,
      latestMeasurement,
      completedChallenges,
      unlockedBadges,
      allFoodLogs,
      pastWeekFoodLogs,
      dbRecommendations,
      followersCount,
      followingCount,
      activePartnerStreaks,
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
        orderBy: { loggedAt: 'asc' },
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
      prisma.foodLog.findMany({
        where: { userId, loggedAt: { gte: rolling7DaysStart, lte: todayEnd } },
        include: {
          foodCatalog: {
            include: { foodGroup: true },
          },
        },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.foodGroupRecommendation.findMany({
        where: { isActive: true },
        orderBy: { no: 'asc' },
      }),
      prisma.userFollow.count({ where: { followingId: userId } }),
      prisma.userFollow.count({ where: { followerId: userId } }),
      prisma.streakPartner.findMany({
        where: {
          OR: [{ userId }, { partnerId: userId }],
          status: 'active',
        },
      }),
    ]);

    // Streaks
    const streakDays = calculateStreakDays(allFoodLogs.map((item: { loggedAt: Date }) => item.loggedAt), targetDate);

    // Calculate accurate active partner streak
    const activePartnerIds = activePartnerStreaks.map((s) => (s.userId === userId ? s.partnerId : s.userId));
    let partnerStreakDays = 0;

    if (activePartnerIds.length > 0) {
      const partnerFoodLogs = await prisma.foodLog.findMany({
        where: { userId: { in: activePartnerIds } },
        select: { userId: true, loggedAt: true },
      });

      const pLogsMap = new Map<string, Date[]>();
      for (const pl of partnerFoodLogs) {
        const list = pLogsMap.get(pl.userId) || [];
        list.push(pl.loggedAt);
        pLogsMap.set(pl.userId, list);
      }

      const myDates = allFoodLogs.map((item: { loggedAt: Date }) => item.loggedAt);
      for (const s of activePartnerStreaks) {
        const pId = s.userId === userId ? s.partnerId : s.userId;
        const pDates = pLogsMap.get(pId) || [];
        const partnerRes = calculatePartnerStreak(myDates, pDates, targetDate);

        if (partnerRes.streakDays > partnerStreakDays) {
          partnerStreakDays = partnerRes.streakDays;
        }

        if (s.streakDays !== partnerRes.streakDays) {
          prisma.streakPartner.update({
            where: { id: s.id },
            data: { streakDays: partnerRes.streakDays },
          }).catch(() => {});
        }
      }
    }

    // IDDS & UPF Calculations
    const consumedGroupsMap = new Map<string, { id: string; name: string; isUpf: boolean; count: number }>();
    const consumedCountsByName: Record<string, number> = {};
    let upfCount = 0;

    for (const log of todayFoodLogs) {
      const groups = extractFoodGroupsFromLog(log.foodName, log.foodCatalog?.foodGroup?.name);
      for (const grpName of groups) {
        const isUpf = grpName.toLowerCase().includes('upf') || grpName.toLowerCase().includes('ultra');
        if (isUpf) {
          upfCount++;
        }
        consumedCountsByName[grpName] = (consumedCountsByName[grpName] || 0) + 1;

        const existing = consumedGroupsMap.get(grpName);
        if (existing) {
          existing.count++;
        } else {
          consumedGroupsMap.set(grpName, {
            id: log.foodCatalog?.foodGroup?.id || grpName,
            name: grpName,
            isUpf,
            count: 1,
          });
        }
      }
    }

    const consumedGroups = Array.from(consumedGroupsMap.values());
    const iddsScoreToday = Math.min(13, consumedGroups.length);

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

    // 1. Evaluate 13 Food Group Recommendations for Today (status chips in dashboard)
    const { evaluations: foodGroupRecommendations } = generateAllFoodGroupEvaluations(
      consumedCountsByName,
      'daily'
    );

    // 2. Weekly BCT Recommendations (based on rolling 7 days / 1-week food logs from food_group_recommendations table)
    const weeklyCountsByName: Record<string, number> = {};
    for (const log of pastWeekFoodLogs) {
      const groups = extractFoodGroupsFromLog(log.foodName, log.foodCatalog?.foodGroup?.name);
      for (const grp of groups) {
        weeklyCountsByName[grp] = (weeklyCountsByName[grp] || 0) + 1;
      }
    }

    const evaluatedBctList = dbRecommendations.map((rec) => {
      let actualWeeklyCount = 0;
      for (const [grpKey, cnt] of Object.entries(weeklyCountsByName)) {
        const match = findRecommendationConfig(grpKey);
        if (match && match.no === rec.no) {
          actualWeeklyCount += cnt;
        }
      }

      const isMinimal = rec.targetDirection.toLowerCase() === 'minimal';
      let status: 'kurang' | 'sesuai' | 'lebih';
      let message: string;
      let needsAttention = false;
      let deficit = 0;

      if (isMinimal) {
        if (actualWeeklyCount < rec.targetWeekly) {
          status = 'kurang';
          message = rec.messageKurang;
          needsAttention = true;
          deficit = rec.targetWeekly - actualWeeklyCount;
        } else if (actualWeeklyCount === rec.targetWeekly) {
          status = 'sesuai';
          message = rec.messageSesuai;
        } else {
          status = 'lebih';
          message = rec.messageLebih;
        }
      } else {
        // UPF (Maksimal)
        if (actualWeeklyCount > rec.targetWeekly) {
          status = 'lebih';
          message = rec.messageLebih;
          needsAttention = true;
          deficit = 100 + (actualWeeklyCount - rec.targetWeekly);
        } else if (actualWeeklyCount === rec.targetWeekly) {
          status = 'sesuai';
          message = rec.messageSesuai;
        } else {
          status = 'kurang';
          message = rec.messageKurang;
        }
      }

      return {
        id: rec.id,
        no: rec.no,
        foodGroupName: rec.foodGroupName,
        targetDirection: rec.targetDirection,
        targetWeekly: rec.targetWeekly,
        actualCount: actualWeeklyCount,
        status,
        message,
        needsAttention,
        deficit,
        iconKey: rec.iconKey,
      };
    });

    const attentionList = evaluatedBctList
      .filter((e) => e.needsAttention)
      .sort((a, b) => b.deficit - a.deficit);
    const satisfiedList = evaluatedBctList.filter((e) => !e.needsAttention);
    const prioritizedBctList = [...attentionList, ...satisfiedList];

    // Rotasi harian: agar setiap hari berganti kelompok pangan dan semua mendapatkan giliran pesan
    const dayOfYear = Math.floor(
      (targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const activeIndex = prioritizedBctList.length > 0 ? dayOfYear % prioritizedBctList.length : 0;
    const currentBctRecommendation = prioritizedBctList[activeIndex] || null;

    // Profile calculations
    const profile = user?.profile;
    const age = calculateAge(profile?.birthDate);
    const currentHeight = profile?.heightCm ?? 155;
    const currentWeight = profile?.weightKg ?? 44;
    const bmi = calculateBmi(currentWeight, currentHeight);
    const nutritionalStatus = getNutritionalStatus(bmi);
    const targetWaterMl = calculateTargetWaterMl(profile?.gender ?? 'female', age.years);
    const bctAdvice = currentBctRecommendation
      ? currentBctRecommendation.message
      : getBctAdvice(nutritionalStatus.key);

    // Hydration calculations: Only count logs AFTER the last reset (if any reset happened today)
    const resetAt = profile?.lastHydrationResetAt;
    const effectiveStart = resetAt && resetAt >= todayStart ? resetAt : todayStart;
    const activeHydrationLogs = todayHydrationLogs.filter((l: { loggedAt: Date; amountMl: number }) => l.loggedAt >= effectiveStart);
    const currentWaterMl = activeHydrationLogs.reduce((sum: number, item: { amountMl: number }) => sum + item.amountMl, 0);
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
            followersCount,
            followingCount,
            partnerStreakDays,
            activeStreaksCount: activePartnerStreaks.length,
          }
        : null,
      bctRecommendation: currentBctRecommendation,
      bctRecommendations: prioritizedBctList,
      measurement: latestMeasurement,
      streakDays,
      partnerStreakDays,
      activeStreaksCount: activePartnerStreaks.length,
      idds: {
        scoreToday: iddsScoreToday,
        categoryLabel: iddsCategoryLabel,
        categoryColor: iddsCategoryColor,
        consumedGroupsCount: consumedGroups.length,
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
      priorityAdvices: prioritizedBctList.filter((b) => b.needsAttention).map((b) => b.message),
      todayFoodLogs,
    };
  },

  async getWeeklyReport(userId: string, date = new Date()) {
    const targetDate = new Date(date);
    // Rolling 7 days ending on targetDate (i.e. target - 6 days to target)
    const sevenDaysAgo = new Date(targetDate.getTime() - 6 * 24 * 60 * 60 * 1000);
    const weekStart = startOfDay(sevenDaysAgo);
    const weekEnd = endOfDay(targetDate);

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

    // Build 7-day array ending on targetDate
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dailyTrends = [];
    let totalScore = 0;
    let daysWithScores = 0;

    const consumedCountsByName: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dayStart = startOfDay(currentDay);
      const dayEnd = endOfDay(currentDay);

      // Filter food logs for this day
      const dayFoods = foodLogsInWeek.filter(
        (log) => log.loggedAt >= dayStart && log.loggedAt <= dayEnd
      );

      // Distinct food groups consumed on this day
      const dayGroupsMap = new Map<string, boolean>();
      for (const log of dayFoods) {
        const groups = extractFoodGroupsFromLog(log.foodName, log.foodCatalog?.foodGroup?.name);
        for (const grp of groups) {
          dayGroupsMap.set(grp, true);
          consumedCountsByName[grp] = (consumedCountsByName[grp] || 0) + 1;
        }
      }

      const score = Math.min(13, dayGroupsMap.size);
      if (score > 0 || dayFoods.length > 0) {
        totalScore += score;
        daysWithScores++;
      }

      // Total hydration logs for this day (total actual consumption, unaffected by dashboard manual reset)
      const dayHydration = hydrationLogsInWeek.filter(
        (log) => log.loggedAt >= dayStart && log.loggedAt <= dayEnd
      );
      const water = dayHydration.reduce((sum, log) => sum + log.amountMl, 0);

      dailyTrends.push({
        date: toDateOnlyString(currentDay),
        day: dayNames[currentDay.getDay()],
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