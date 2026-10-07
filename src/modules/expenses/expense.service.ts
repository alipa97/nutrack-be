import { prisma } from '../../config/prisma.js';
import { endOfDay, startOfDay } from '../../utils/date.js';

export interface CreateExpenseInput {
  amount: number;
  category: string;
  description?: string;
  loggedAt?: Date | string;
}

export const expenseService = {
  async list(userId: string, dateStr?: string) {
    let whereClause: any = { userId };

    if (dateStr) {
      const date = new Date(dateStr);
      whereClause.loggedAt = {
        gte: startOfDay(date),
        lte: endOfDay(date),
      };
    }

    const expenses = await prisma.foodExpense.findMany({
      where: whereClause,
      orderBy: { loggedAt: 'desc' },
    });

    return expenses;
  },

  async create(userId: string, input: CreateExpenseInput) {
    if (!input.amount || input.amount <= 0) {
      throw Object.assign(new Error('Jumlah pengeluaran harus lebih besar dari 0'), { statusCode: 400 });
    }
    if (!input.category || !input.category.trim()) {
      throw Object.assign(new Error('Kategori pengeluaran wajib diisi'), { statusCode: 400 });
    }

    const loggedAt = input.loggedAt ? new Date(input.loggedAt) : new Date();

    const created = await prisma.foodExpense.create({
      data: {
        userId,
        amount: Number(input.amount),
        category: input.category.trim(),
        description: input.description?.trim() || null,
        loggedAt,
      },
    });

    return created;
  },

  async delete(userId: string, expenseId: string) {
    const existing = await prisma.foodExpense.findFirst({
      where: { id: expenseId, userId },
    });

    if (!existing) {
      throw Object.assign(new Error('Data pengeluaran tidak ditemukan'), { statusCode: 404 });
    }

    await prisma.foodExpense.delete({
      where: { id: expenseId },
    });

    return { success: true, id: expenseId };
  },

  async getStats(userId: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [todayExpenses, monthExpenses, allExpenses] = await Promise.all([
      prisma.foodExpense.findMany({
        where: { userId, loggedAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.foodExpense.findMany({
        where: { userId, loggedAt: { gte: firstDayOfMonth, lte: lastDayOfMonth } },
      }),
      prisma.foodExpense.findMany({
        where: { userId },
        orderBy: { loggedAt: 'desc' },
        take: 20,
      }),
    ]);

    const totalToday = todayExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalMonth = monthExpenses.reduce((sum, item) => sum + item.amount, 0);

    const categoryBreakdown: Record<string, number> = {};
    for (const item of monthExpenses) {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + item.amount;
    }

    return {
      totalToday,
      totalMonth,
      countToday: todayExpenses.length,
      countMonth: monthExpenses.length,
      categoryBreakdown,
      recentExpenses: allExpenses,
    };
  },
};
