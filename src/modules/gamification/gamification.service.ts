import { prisma } from '../../config/prisma.js';
import { endOfDay, getWeekEndDate, getWeekStartDate, startOfDay, toDateOnlyString } from '../../utils/date.js';

// Regex for detecting vegetable items from name or catalog
const VEGGIE_REGEX =
  /(sayur|bayam|kangkung|wortel|brokoli|tomat|timun|mentimun|terong|sawi|kubis|kol|labu|buncis|selada|daun singkong|kacang panjang|pare|tauge|taoge|oyong|jamur|kelor|katuk|asparagus)/i;

export const gamificationService = {
  /**
   * Evaluates weekly challenge progress for a user for the specified week (Sunday to Saturday).
   * Automatically calculates currentDays from real food and hydration logs,
   * sets startedAt when the first daily target is reached in this week,
   * and tracks lastProgressAt.
   */
  async evaluateWeeklyChallenges(userId: string, refDate = new Date()) {
    const weekStart = getWeekStartDate(refDate);
    const weekEnd = getWeekEndDate(refDate);

    // 1. Fetch active weekly challenges
    const challenges = await prisma.weeklyChallenge.findMany({
      where: { isActive: true },
    });
    if (challenges.length === 0) return;

    // 2. Fetch all logs for this week
    const [hydrationLogs, foodLogs] = await Promise.all([
      prisma.hydrationLog.findMany({
        where: {
          userId,
          loggedAt: { gte: weekStart, lte: weekEnd },
        },
        orderBy: { loggedAt: 'asc' },
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
    ]);

    // Challenge 1: Hydration Hero -> Water >= 2000 ml (2 Liters) per day
    const dailyWaterMap = new Map<string, number>();
    for (const log of hydrationLogs) {
      const dateKey = toDateOnlyString(log.loggedAt);
      dailyWaterMap.set(dateKey, (dailyWaterMap.get(dateKey) ?? 0) + log.amountMl);
    }
    const hydrationQualifyingDates: string[] = [];
    for (const [dateKey, totalMl] of dailyWaterMap.entries()) {
      if (totalMl >= 2000) {
        hydrationQualifyingDates.push(dateKey);
      }
    }
    hydrationQualifyingDates.sort();

    // Challenge 2: Veggie Warrior -> Mencatat kelompok pangan Sayur Kaya Vit. A, Sayur Hijau Gelap, atau Sayuran Lainnya
    // Lolos (+1 hari) jika pengguna mengonsumsi salah satu dari 3 kelompok pangan ini dalam 1 hari kalender
    const TARGET_VEG_GROUPS = [
      'sayur/umbi kaya vitamin a',
      'sayuran hijau berdaun gelap',
      'sayuran lainnya',
    ];

    const dailyVeggieMap = new Set<string>();
    for (const log of foodLogs) {
      const dateKey = toDateOnlyString(log.loggedAt);
      const groupName = (log.foodCatalog?.foodGroup?.name ?? '').toLowerCase().trim();

      // Cocokkan dengan salah satu dari 3 kelompok pangan sayur resmi
      const isTargetVegGroup =
        TARGET_VEG_GROUPS.some((target) => groupName.includes(target)) ||
        (groupName.includes('sayur') &&
          (groupName.includes('vitamin a') || groupName.includes('hijau') || groupName.includes('lainnya')));

      // Fallback cerdas berdasarkan nama makanan jika catalog belum terhubung
      const isVegNameFallback =
        VEGGIE_REGEX.test(log.foodName) ||
        (log.foodCatalog ? VEGGIE_REGEX.test(log.foodCatalog.name) : false);

      if (isTargetVegGroup || isVegNameFallback) {
        dailyVeggieMap.add(dateKey);
      }
    }
    const veggieQualifyingDates = Array.from(dailyVeggieMap).sort();

    // Challenge 3: Master Tracker -> Mengunggah food log lengkap (pagi, siang, malam) dalam 1 hari
    // Suatu hari hanya terhitung sukses (+1) jika pengguna mencatat lengkap: sarapan (breakfast), makan siang (lunch), dan makan malam (dinner)
    const dailyMealsMap = new Map<string, Set<string>>();
    for (const log of foodLogs) {
      const dateKey = toDateOnlyString(log.loggedAt);
      if (!dailyMealsMap.has(dateKey)) {
        dailyMealsMap.set(dateKey, new Set<string>());
      }
      dailyMealsMap.get(dateKey)!.add(log.mealType);
    }

    const trackerQualifyingDates: string[] = [];
    for (const [dateKey, meals] of dailyMealsMap.entries()) {
      if (meals.has('breakfast') && meals.has('lunch') && meals.has('dinner')) {
        trackerQualifyingDates.push(dateKey);
      }
    }
    trackerQualifyingDates.sort();

    // 3. Update or create user_weekly_challenge records for each active challenge
    for (const challenge of challenges) {
      const titleLower = challenge.title.toLowerCase();
      const catLower = (challenge.category ?? '').toLowerCase();

      let qualifyingDates: string[] = [];
      if (titleLower.includes('hydrat') || catLower.includes('hidrasi')) {
        qualifyingDates = hydrationQualifyingDates;
      } else if (titleLower.includes('veggie') || titleLower.includes('sayur') || catLower.includes('sayur')) {
        qualifyingDates = veggieQualifyingDates;
      } else if (
        titleLower.includes('tracker') ||
        titleLower.includes('logger') ||
        catLower.includes('pencatatan') ||
        catLower.includes('makan')
      ) {
        qualifyingDates = trackerQualifyingDates;
      }

      const calculatedDays = Math.min(qualifyingDates.length, challenge.targetDays);

      const existing = await prisma.userWeeklyChallenge.findUnique({
        where: {
          userId_challengeId_weekStart: {
            userId,
            challengeId: challenge.id,
            weekStart,
          },
        },
      });

      if (!existing) {
        // Record doesn't exist yet: create when user reaches first daily target in this week
        if (calculatedDays > 0) {
          const firstDateStr = qualifyingDates[0];
          const startedAt = firstDateStr ? new Date(`${firstDateStr}T00:00:00.000+07:00`) : new Date();

          await prisma.userWeeklyChallenge.create({
            data: {
              userId,
              challengeId: challenge.id,
              weekStart,
              currentDays: calculatedDays,
              startedAt,
              lastProgressAt: new Date(),
              isCompleted: false,
            },
          });
        }
      } else {
        // Record exists: update progress if not completed
        if (!existing.isCompleted) {
          const newDays = Math.max(existing.currentDays, calculatedDays);
          const updateData: {
            currentDays?: number;
            lastProgressAt?: Date;
            startedAt?: Date;
          } = {};

          if (newDays !== existing.currentDays) {
            updateData.currentDays = newDays;
            updateData.lastProgressAt = new Date();
          }

          if (qualifyingDates.length > 0) {
            const firstDateWib = new Date(`${qualifyingDates[0]}T00:00:00.000+07:00`);
            if (!existing.startedAt || existing.startedAt > firstDateWib) {
              updateData.startedAt = firstDateWib;
            }
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.userWeeklyChallenge.update({
              where: { id: existing.id },
              data: updateData,
            });
          }
        }
      }
    }
  },

  /**
   * Retrieves full gamification summary for the current active week.
   * Auto-evaluates challenges against current logs before returning.
   */
  async summary(userId: string) {
    const currentWeekStart = getWeekStartDate();
    const currentWeekEnd = getWeekEndDate();

    // 1. Automatically evaluate challenges to guarantee fresh and accurate state
    try {
      await this.evaluateWeeklyChallenges(userId);
    } catch (err) {
      console.error('Error evaluating weekly challenges:', err);
    }

    const [profile, allBadges, userBadges, allChallenges, userChallenges] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.badge.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
      prisma.userBadge.findMany({ where: { userId } }),
      prisma.weeklyChallenge.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
      prisma.userWeeklyChallenge.findMany({
        where: {
          userId,
          weekStart: currentWeekStart,
        },
        include: { challenge: true },
      }),
    ]);

    // Map badges with unlock status
    const unlockedMap = new Map<string, { isUnlocked: boolean; unlockedAt: Date | null }>();
    for (const ub of userBadges) {
      unlockedMap.set(ub.badgeId, {
        isUnlocked: ub.isUnlocked,
        unlockedAt: ub.unlockedAt,
      });
    }

    const badges = allBadges.map((badge) => {
      const ub = unlockedMap.get(badge.id);
      return {
        id: badge.id,
        code: badge.code,
        title: badge.title,
        description: badge.description,
        iconKey: badge.iconKey ?? 'stars_rounded',
        isUnlocked: ub?.isUnlocked ?? false,
        unlockedAt: ub?.unlockedAt ?? null,
      };
    });

    // Map weekly challenges for the current active week
    const userChallengeMap = new Map<string, (typeof userChallenges)[0]>();
    for (const uc of userChallenges) {
      userChallengeMap.set(uc.challengeId, uc);
    }

    const challenges = allChallenges.map((challenge) => {
      const uc = userChallengeMap.get(challenge.id);
      const currentDays = uc?.currentDays ?? 0;
      const isCompleted = uc?.isCompleted ?? false;
      const totalTargetDays = challenge.targetDays;
      const canClaim = !isCompleted && currentDays >= totalTargetDays;

      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category ?? 'Tantangan Mingguan',
        totalTargetDays,
        currentDays,
        rewardXp: challenge.rewardXp,
        isCompleted,
        canClaim,
        progress: totalTargetDays > 0 ? Number(Math.min(1.0, currentDays / totalTargetDays).toFixed(2)) : 0,
        startedAt: uc?.startedAt ?? null,
        completedAt: uc?.completedAt ?? null,
        weekStart: currentWeekStart.toISOString().slice(0, 10),
        weekEnd: currentWeekEnd.toISOString().slice(0, 10),
      };
    });

    return {
      xp: profile?.xp ?? 0,
      badgeCount: badges.filter((b) => b.isUnlocked).length,
      completedChallengesCount: challenges.filter((c) => c.isCompleted).length,
      weekStart: currentWeekStart.toISOString().slice(0, 10),
      weekEnd: currentWeekEnd.toISOString().slice(0, 10),
      badges,
      challenges,
    };
  },

  /**
   * Claims a completed challenge reward for the current week.
   * Awards XP, marks user_weekly_challenge as isCompleted, and unlocks the corresponding badge.
   */
  async claimChallenge(userId: string, challengeId: string, weekDate = new Date()) {
    const weekStart = getWeekStartDate(weekDate);

    // Refresh evaluation first
    await this.evaluateWeeklyChallenges(userId, weekDate);

    const challenge = await prisma.weeklyChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw Object.assign(new Error('Tantangan tidak ditemukan'), { statusCode: 404 });
    }

    const existing = await prisma.userWeeklyChallenge.findUnique({
      where: {
        userId_challengeId_weekStart: {
          userId,
          challengeId,
          weekStart,
        },
      },
    });

    if (existing?.isCompleted) {
      throw Object.assign(new Error('Hadiah tantangan ini sudah diklaim untuk minggu ini'), { statusCode: 400 });
    }

    if (!existing || existing.currentDays < challenge.targetDays) {
      throw Object.assign(
        new Error(
          `Target tantangan belum tercapai (${existing?.currentDays ?? 0}/${challenge.targetDays} hari)`
        ),
        { statusCode: 400 }
      );
    }

    // Determine badge code to unlock
    const titleLower = challenge.title.toLowerCase();
    const catLower = (challenge.category ?? '').toLowerCase();
    let badgeCode = '';

    if (titleLower.includes('hydrat') || catLower.includes('hidrasi')) {
      badgeCode = 'hydration_hero';
    } else if (titleLower.includes('veggie') || titleLower.includes('sayur') || catLower.includes('sayur')) {
      badgeCode = 'veggie_warrior';
    } else if (
      titleLower.includes('tracker') ||
      titleLower.includes('logger') ||
      catLower.includes('pencatatan') ||
      catLower.includes('makan')
    ) {
      badgeCode = 'master_tracker';
    }

    const [userChallenge] = await prisma.$transaction([
      prisma.userWeeklyChallenge.update({
        where: { id: existing.id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
      }),
      prisma.userProfile.updateMany({
        where: { userId },
        data: { xp: { increment: challenge.rewardXp } },
      }),
    ]);

    // Unlock badge in user_badges
    let unlockedBadge = null;
    if (badgeCode) {
      const badge = await prisma.badge.findUnique({ where: { code: badgeCode } });
      if (badge) {
        unlockedBadge = await prisma.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId,
              badgeId: badge.id,
            },
          },
          create: {
            userId,
            badgeId: badge.id,
            isUnlocked: true,
            unlockedAt: new Date(),
          },
          update: {
            isUnlocked: true,
            unlockedAt: new Date(),
          },
        });
      }
    }

    return {
      message: 'Hadiah tantangan mingguan berhasil diklaim!',
      rewardXp: challenge.rewardXp,
      badgeUnlocked: badgeCode || null,
      userChallenge,
    };
  },
};