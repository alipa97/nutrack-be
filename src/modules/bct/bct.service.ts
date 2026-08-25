import { prisma } from '../../config/prisma.js';
import { startOfDay } from '../../utils/date.js';

export const bctService = {
  async list(userId: string, date = new Date()) {
    const today = startOfDay(new Date(date));

    const [recommendations, todayCompletions] = await Promise.all([
      prisma.bctRecommendation.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.userBctCompletion.findMany({
        where: {
          userId,
          completionDate: today,
        },
      }),
    ]);

    const completedMap = new Set(
      todayCompletions.filter((c) => c.isCompleted).map((c) => c.bctRecommendationId)
    );

    const formatted = recommendations.map((rec) => ({
      id: rec.id,
      title: rec.title,
      category: rec.category,
      bctTechniqueName: rec.techniqueName,
      summary: rec.summary,
      fullContent: rec.fullContent,
      iconKey: rec.iconKey ?? 'grass_rounded',
      isCompletedToday: completedMap.has(rec.id),
      createdAt: rec.createdAt,
    }));

    return formatted;
  },

  async toggleComplete(userId: string, recommendationId: string, date = new Date()) {
    const today = startOfDay(new Date(date));

    const existing = await prisma.userBctCompletion.findUnique({
      where: {
        userId_bctRecommendationId_completionDate: {
          userId,
          bctRecommendationId: recommendationId,
          completionDate: today,
        },
      },
    });

    const newStatus = existing ? !existing.isCompleted : true;

    const [completion] = await prisma.$transaction([
      prisma.userBctCompletion.upsert({
        where: {
          userId_bctRecommendationId_completionDate: {
            userId,
            bctRecommendationId: recommendationId,
            completionDate: today,
          },
        },
        create: {
          userId,
          bctRecommendationId: recommendationId,
          completionDate: today,
          isCompleted: true,
        },
        update: {
          isCompleted: newStatus,
        },
      }),
      // Award +30 XP when completing BCT, or decrement if untoggled
      prisma.userProfile.updateMany({
        where: { userId },
        data: {
          xp: {
            increment: newStatus ? 30 : -30,
          },
        },
      }),
    ]);


    return {
      recommendationId,
      completionDate: today.toISOString().slice(0, 10),
      isCompletedToday: completion.isCompleted,
      xpAwarded: newStatus ? 30 : 0,
    };
  },
};