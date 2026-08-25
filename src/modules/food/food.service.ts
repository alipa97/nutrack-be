import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { endOfDay, startOfDay } from '../../utils/date.js';
import { generateAllFoodGroupEvaluations } from '../../utils/foodRecommendations.js';

export type MealTypeEnum = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type CreateFoodLogInput = {
  foodCatalogId?: string | null;
  foodName: string;
  mealType: MealTypeEnum;
  loggedAt?: string | Date | null;
  imageUrl?: string | null;
  isAiDetected?: boolean;
  aiConfidence?: number | null;
};

export const foodService = {
  async listLogs(userId: string, date?: string | Date) {
    const where: Prisma.FoodLogWhereInput = { userId };
    if (date) {
      const d = new Date(date);
      where.loggedAt = {
        gte: startOfDay(d),
        lte: endOfDay(d),
      };
    }

    return prisma.foodLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' },
      include: {
        foodCatalog: {
          include: { foodGroup: true },
        },
      },
    });
  },

  async createLog(userId: string, input: CreateFoodLogInput) {
    const loggedAt = input.loggedAt ? new Date(input.loggedAt) : new Date();

    let catalogId = input.foodCatalogId ?? undefined;
    if (!catalogId) {
      const match = await prisma.foodCatalog.findFirst({
        where: { name: { contains: input.foodName, mode: 'insensitive' } },
      });
      if (match) {
        catalogId = match.id;
      }
    }

    const [foodLog] = await prisma.$transaction([
      prisma.foodLog.create({
        data: {
          userId,
          foodCatalogId: catalogId,
          foodName: input.foodName,
          mealType: input.mealType,
          loggedAt,
          imageUrl: input.imageUrl ?? undefined,
          isAiDetected: input.isAiDetected ?? false,
          aiConfidence: input.aiConfidence ?? undefined,
        },
        include: {
          foodCatalog: {
            include: { foodGroup: true },
          },
        },
      }),
      // Award +50 XP for logging food
      prisma.userProfile.updateMany({
        where: { userId },
        data: { xp: { increment: 50 } },
      }),
    ]);


    return foodLog;
  },


  async deleteLog(userId: string, logId: string) {
    const existing = await prisma.foodLog.findFirst({
      where: { id: logId, userId },
    });

    if (!existing) {
      throw Object.assign(new Error('Food log not found'), { statusCode: 404 });
    }

    return prisma.foodLog.delete({ where: { id: logId } });
  },

  async updateMealType(userId: string, logId: string, mealType: MealTypeEnum) {
    const existing = await prisma.foodLog.findFirst({
      where: { id: logId, userId },
    });

    if (!existing) {
      throw Object.assign(new Error('Food log not found'), { statusCode: 404 });
    }

    return prisma.foodLog.update({
      where: { id: logId },
      data: { mealType },
      include: {
        foodCatalog: {
          include: { foodGroup: true },
        },
      },
    });
  },

  async dailySummary(userId: string, date = new Date()) {
    const targetDate = new Date(date);
    const todayStart = startOfDay(targetDate);
    const todayEnd = endOfDay(targetDate);

    const logs = await prisma.foodLog.findMany({
      where: { userId, loggedAt: { gte: todayStart, lte: todayEnd } },
      include: {
        foodCatalog: {
          include: { foodGroup: true },
        },
      },
      orderBy: { loggedAt: 'desc' },
    });

    // IDDS calculation: distinct non-UPF groups consumed today
    const consumedGroupsMap = new Map<string, { id: string; name: string; isUpf: boolean; count: number }>();
    const consumedCountsByName: Record<string, number> = {};
    let upfCount = 0;

    for (const log of logs) {
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
    if (iddsScoreToday <= 3) {
      iddsCategoryLabel = 'Keberagaman Pangan Kurang';
    } else if (iddsScoreToday <= 5) {
      iddsCategoryLabel = 'Keberagaman Pangan Sedang';
    }

    const isUpfWarningActive = upfCount > 1;

    // Evaluate 13 Food Group Recommendations
    const { evaluations: foodGroupRecommendations, priorityAdvices } = generateAllFoodGroupEvaluations(
      consumedCountsByName,
      'daily'
    );

    return {
      date: targetDate.toISOString().slice(0, 10),
      iddsScoreToday,
      iddsCategoryLabel,
      consumedGroupsCount: nonUpfGroupsCount,
      consumedGroups,
      upfCountToday: upfCount,
      isUpfWarningActive,
      totalLogsToday: logs.length,
      foodGroupRecommendations,
      priorityAdvices,
      logs,
    };
  },


  async listCatalog(query?: string, foodGroupId?: string) {
    const where: Prisma.FoodCatalogWhereInput = { isActive: true };
    if (query) {
      where.name = { contains: query, mode: 'insensitive' };
    }
    if (foodGroupId) {
      where.foodGroupId = foodGroupId;
    }

    return prisma.foodCatalog.findMany({
      where,
      include: { foodGroup: true },
      orderBy: { name: 'asc' },
    });
  },

  async listFoodGroups() {
    return prisma.foodGroup.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { foodCatalogs: true },
        },
      },
    });
  },
};