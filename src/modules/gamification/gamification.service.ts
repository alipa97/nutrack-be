import { prisma } from '../../config/prisma.js';
import { getWeekStartDate } from '../../utils/date.js';

export const gamificationService = {
  async summary(userId: string) {
    const currentWeekStart = getWeekStartDate();

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

      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category ?? 'Tantangan Mingguan',
        totalTargetDays,
        currentDays,
        rewardXp: challenge.rewardXp,
        isCompleted,
        progress: totalTargetDays > 0 ? Number(Math.min(1.0, currentDays / totalTargetDays).toFixed(2)) : 0,
        weekStart: currentWeekStart.toISOString().slice(0, 10),
      };
    });

    return {
      xp: profile?.xp ?? 0,
      badgeCount: badges.filter((b) => b.isUnlocked).length,
      completedChallengesCount: challenges.filter((c) => c.isCompleted).length,
      badges,
      challenges,
    };
  },

  async claimChallenge(userId: string, challengeId: string, weekDate = new Date()) {
    const weekStart = getWeekStartDate(weekDate);

    const challenge = await prisma.weeklyChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw Object.assign(new Error('Challenge not found'), { statusCode: 404 });
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
      throw Object.assign(new Error('Challenge reward already claimed this week'), { statusCode: 400 });
    }

    const [userChallenge] = await prisma.$transaction([
      prisma.userWeeklyChallenge.upsert({
        where: {
          userId_challengeId_weekStart: {
            userId,
            challengeId,
            weekStart,
          },
        },
        create: {
          userId,
          challengeId,
          weekStart,
          currentDays: challenge.targetDays,
          isCompleted: true,
          completedAt: new Date(),
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
        },
      }),
      prisma.userProfile.updateMany({
        where: { userId },
        data: { xp: { increment: challenge.rewardXp } },
      }),
    ]);


    return {
      message: 'Challenge reward claimed successfully',
      rewardXp: challenge.rewardXp,
      userChallenge,
    };
  },
};