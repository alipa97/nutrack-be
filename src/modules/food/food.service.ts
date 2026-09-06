import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { endOfDay, startOfDay } from '../../utils/date.js';
import { extractFoodGroupsFromLog, generateAllFoodGroupEvaluations } from '../../utils/foodRecommendations.js';
import { gamificationService } from '../gamification/gamification.service.js';

export type MealTypeEnum = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type CreateFoodLogInput = {
  foodCatalogId?: string | null;
  foodName: string;
  foodGroupName?: string | null;
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
      let d: Date;
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        d = new Date(`${date}T00:00:00.000+07:00`);
      } else {
        d = new Date(date);
      }
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
      const cleanFoodName = input.foodName.trim().toLowerCase();
      const catalogs = await prisma.foodCatalog.findMany({
        where: { isActive: true },
        include: { foodGroup: true },
      });

      const isGroupMatch = (dbGroupName: string, inputGroup?: string): boolean => {
        if (!inputGroup) return false;
        const a = dbGroupName.toLowerCase().trim();
        const b = inputGroup.toLowerCase().trim();
        if (a === b) return true;
        if ((a.includes('upf') || a.includes('ultra')) && (b.includes('upf') || b.includes('ultra'))) return true;
        if (a.includes('hijau') && b.includes('hijau')) return true;
        if ((a.includes('vit') || a.includes('vitamin')) && a.includes('sayur') && b.includes('sayur')) return true;
        if ((a.includes('vit') || a.includes('vitamin')) && a.includes('buah') && b.includes('buah')) return true;
        if (a.includes('ikan') && (b.includes('ikan') || b.includes('seafood'))) return true;
        if (a.includes('umbi') && b.includes('umbi')) return true;
        if (a.includes('kacang') && b.includes('kacang')) return true;
        if (a.includes('susu') && b.includes('susu')) return true;
        return a.includes(b) || b.includes(a);
      };

      const fgName = input.foodGroupName || undefined;

      // 1. Exact match by catalog name (replacing underscore with space)
      const exactMatches = catalogs.filter(
        (c) => c.name.replace(/_/g, ' ').toLowerCase() === cleanFoodName
      );
      let match: (typeof catalogs)[0] | undefined =
        exactMatches.find((c) => isGroupMatch(c.foodGroup.name, fgName)) ||
        exactMatches[0];

      // 2. Substring match prioritizing matching food group (if fgName is provided)
      if (!match && fgName) {
        const groupCatalogs = catalogs.filter((c) =>
          isGroupMatch(c.foodGroup.name, fgName)
        );
        // Sort descending by name length (longest / most specific match first)
        groupCatalogs.sort((a, b) => b.name.length - a.name.length);
        match = groupCatalogs.find((c) => {
          const catName = c.name.replace(/_/g, ' ').toLowerCase();
          return cleanFoodName.includes(catName) || catName.includes(cleanFoodName);
        });
      }

      // 3. Substring match across all catalogs, sorted by name length descending (longest match first)
      if (!match) {
        const sortedCatalogs = [...catalogs].sort((a, b) => b.name.length - a.name.length);
        if (fgName) {
          match = sortedCatalogs.find((c) => {
            const catName = c.name.replace(/_/g, ' ').toLowerCase();
            return (
              isGroupMatch(c.foodGroup.name, fgName) &&
              (cleanFoodName.includes(catName) || catName.includes(cleanFoodName))
            );
          });
        }
        if (!match) {
          match = sortedCatalogs.find((c) => {
            const catName = c.name.replace(/_/g, ' ').toLowerCase();
            return cleanFoodName.includes(catName) || catName.includes(cleanFoodName);
          });
        }
      }

      // 4. Fallback: match against FoodGroup table description keywords
      if (!match) {
        const groups = await prisma.foodGroup.findMany({ where: { isActive: true } });
        for (const g of groups) {
          if (g.description) {
            const keywords = g.description.split(',').map((k) => k.trim().toLowerCase());
            if (keywords.some((k) => cleanFoodName.includes(k) || k.includes(cleanFoodName))) {
              match = catalogs.find((c) => c.foodGroupId === g.id);
              break;
            }
          }
        }
      }

      // 5. Fallback: match by foodGroupName
      if (!match && fgName) {
        match = catalogs.find((c) => isGroupMatch(c.foodGroup.name, fgName));
      }

      if (match) {
        catalogId = match.id;
      }
    }

    const foodLog = await prisma.foodLog.create({
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
    });

    // Evaluate gamification challenges asynchronously
    gamificationService.evaluateWeeklyChallenges(userId, loggedAt).catch((err) => {
      console.error('Failed to evaluate gamification challenges on food log:', err);
    });

    return foodLog;
  },

  async deleteLog(userId: string, logId: string) {
    const existing = await prisma.foodLog.findFirst({
      where: { id: logId, userId },
    });

    if (!existing) {
      throw Object.assign(new Error('Food log not found'), { statusCode: 404 });
    }

    const deleted = await prisma.foodLog.delete({ where: { id: logId } });

    // Refresh gamification challenges after deletion
    gamificationService.evaluateWeeklyChallenges(userId, existing.loggedAt).catch((err) => {
      console.error('Failed to evaluate gamification challenges on food log delete:', err);
    });

    return deleted;
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