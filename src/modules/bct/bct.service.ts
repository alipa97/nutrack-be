import { prisma } from '../../config/prisma.js';
import { startOfDay, endOfDay, getWeekStartDate } from '../../utils/date.js';
import { generateAllFoodGroupEvaluations } from '../../utils/foodRecommendations.js';

export const bctService = {
  /**
   * Lists the 13 official Food Group Recommendations as the primary BCT recommendations dataset.
   * Tracks daily completion status per user.
   */
  async list(userId: string, date = new Date()) {
    const today = startOfDay(new Date(date));

    const [recommendations, todayCompletions] = await Promise.all([
      prisma.foodGroupRecommendation.findMany({
        where: { isActive: true },
        orderBy: { no: 'asc' },
      }),
      prisma.userBctCompletion.findMany({
        where: {
          userId,
          completionDate: today,
        },
      }),
    ]);

    const completedMap = new Set(
      todayCompletions.filter((c) => c.isCompleted).map((c) => c.foodGroupRecommendationId)
    );

    const formatted = recommendations.map((rec) => ({
      id: rec.id,
      no: rec.no,
      title: rec.foodGroupName,
      category: '13 Kelompok Pangan',
      bctTechniqueName: 'Anjuran Konsumsi Pangan',
      summary: rec.messageKurang,
      fullContent: `Target Harian: ${rec.targetDaily} porsi (${rec.targetDirection}) | Target Mingguan: ${rec.targetWeekly} porsi\n\nPesan Anjuran:\n• Kurang: ${rec.messageKurang}\n• Sesuai: ${rec.messageSesuai}\n• Lebih: ${rec.messageLebih}`,
      iconKey: rec.iconKey ?? 'grass_rounded',
      targetDirection: rec.targetDirection,
      targetDaily: rec.targetDaily,
      targetWeekly: rec.targetWeekly,
      messageKurang: rec.messageKurang,
      messageSesuai: rec.messageSesuai,
      messageLebih: rec.messageLebih,
      isCompletedToday: completedMap.has(rec.id),
      createdAt: rec.createdAt,
    }));

    return formatted;
  },

  async toggleComplete(userId: string, recommendationId: string, date = new Date()) {
    const today = startOfDay(new Date(date));

    const existing = await prisma.userBctCompletion.findUnique({
      where: {
        userId_foodGroupRecommendationId_completionDate: {
          userId,
          foodGroupRecommendationId: recommendationId,
          completionDate: today,
        },
      },
    });

    const newStatus = existing ? !existing.isCompleted : true;

    const completion = await prisma.userBctCompletion.upsert({
      where: {
        userId_foodGroupRecommendationId_completionDate: {
          userId,
          foodGroupRecommendationId: recommendationId,
          completionDate: today,
        },
      },
      create: {
        userId,
        foodGroupRecommendationId: recommendationId,
        completionDate: today,
        isCompleted: true,
      },
      update: {
        isCompleted: newStatus,
      },
    });

    return {
      recommendationId,
      completionDate: today.toISOString().slice(0, 10),
      isCompletedToday: completion.isCompleted,
    };
  },

  /**
   * Dynamically evaluates user's food consumption against the 13 food group targets.
   * Replaces the old static BCT recommendations for food groups.
   *
   * @param period - 'daily' evaluates today only, 'weekly' evaluates the current week (Mon–Sun)
   */
  async getFoodGroupEvaluations(userId: string, period: 'daily' | 'weekly' = 'daily', date = new Date()) {
    const targetDate = new Date(date);
    let dateStart: Date;
    let dateEnd: Date;

    if (period === 'weekly') {
      dateStart = getWeekStartDate(targetDate);
      dateEnd = endOfDay(new Date(dateStart.getTime() + 6 * 24 * 60 * 60 * 1000)); // Sunday end
    } else {
      dateStart = startOfDay(targetDate);
      dateEnd = endOfDay(targetDate);
    }

    // Get all food logs in the period, joined with food catalog → food group
    const logs = await prisma.foodLog.findMany({
      where: {
        userId,
        loggedAt: { gte: dateStart, lte: dateEnd },
      },
      include: {
        foodCatalog: {
          include: {
            foodGroup: true,
          },
        },
      },
    });

    // Count consumption per food group name
    const consumedCounts: Record<string, number> = {};
    for (const log of logs) {
      const groupName = log.foodCatalog?.foodGroup?.name;
      if (groupName) {
        consumedCounts[groupName] = (consumedCounts[groupName] || 0) + 1;
      }
    }

    const { evaluations, priorityAdvices } = generateAllFoodGroupEvaluations(consumedCounts, period);

    return {
      period,
      dateRange: {
        start: dateStart.toISOString().slice(0, 10),
        end: dateEnd.toISOString().slice(0, 10),
      },
      totalLogsInPeriod: logs.length,
      evaluations,
      priorityAdvices,
    };
  },

  /**
   * Returns all 13 official Food Group Recommendations master data from Client PDF.
   */
  async getFoodGroupRecommendations() {
    return prisma.foodGroupRecommendation.findMany({
      where: { isActive: true },
      orderBy: { no: 'asc' },
    });
  },
};