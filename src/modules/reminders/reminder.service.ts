import { prisma } from '../../config/prisma.js';

export type ReminderInput = {
  title: string;
  description: string;
  reminderTime: string;
  isEnabled?: boolean;
  isDefault?: boolean;
  iconKey?: string;
  repeatRule?: string;
};

export const defaultSmartReminders = [
  {
    title: 'Olahraga Pagi',
    description: 'Pagi! Olahraga apa yang mau kamu coba hari ini? Semangat pagi!',
    reminderTime: '07:00',
    iconKey: 'wb_sunny_rounded',
    isDefault: true,
  },
  {
    title: 'Minum & Makan Siang',
    description: 'Perut mulai lapar? Yuk makan siang & jangan lupa juga minum air putih ya!',
    reminderTime: '12:00',
    iconKey: 'restaurant_rounded',
    isDefault: true,
  },
  {
    title: 'Olahraga Sore',
    description: 'Sore-sore enaknya jalan kaki atau stretching dulu. Udah sempat olahraga belum?',
    reminderTime: '16:30',
    iconKey: 'directions_run_rounded',
    isDefault: true,
  },
  {
    title: 'Minum Air Malam',
    description: 'Udah berapa gelas air putih yang kamu minum hari ini? Yuk dicek dan dicatat!',
    reminderTime: '20:00',
    iconKey: 'water_drop_rounded',
    isDefault: true,
  },
  {
    title: 'Waktu Tidur Malam',
    description: 'Waktunya bersiap tidur! Tidur cukup penting buat badan & mood kamu besok. Jangan begadang ya!',
    reminderTime: '21:30',
    iconKey: 'bedtime_rounded',
    isDefault: true,
  },
];

export const reminderService = {
  async list(userId: string) {
    let reminders = await prisma.smartReminder.findMany({
      where: { userId },
      orderBy: { reminderTime: 'asc' },
    });

    // Automatically seed default reminders if none exist for user
    if (reminders.length === 0) {
      await prisma.smartReminder.createMany({
        data: defaultSmartReminders.map((r) => ({
          userId,
          title: r.title,
          description: r.description,
          reminderTime: r.reminderTime,
          iconKey: r.iconKey,
          isDefault: true,
          isEnabled: true,
        })),
      });

      reminders = await prisma.smartReminder.findMany({
        where: { userId },
        orderBy: { reminderTime: 'asc' },
      });
    }

    return reminders;
  },

  async create(userId: string, input: ReminderInput) {
    return prisma.smartReminder.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        reminderTime: input.reminderTime,
        isEnabled: input.isEnabled ?? true,
        isDefault: input.isDefault ?? false,
        iconKey: input.iconKey,
        repeatRule: input.repeatRule,
      },
    });
  },

  async update(userId: string, reminderId: string, input: Partial<ReminderInput>) {
    const existing = await prisma.smartReminder.findFirst({
      where: { id: reminderId, userId },
    });

    if (!existing) {
      throw Object.assign(new Error('Reminder not found'), { statusCode: 404 });
    }

    return prisma.smartReminder.update({
      where: { id: reminderId },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.reminderTime ? { reminderTime: input.reminderTime } : {}),
        ...(typeof input.isEnabled === 'boolean' ? { isEnabled: input.isEnabled } : {}),
        ...(input.iconKey !== undefined ? { iconKey: input.iconKey } : {}),
        ...(input.repeatRule !== undefined ? { repeatRule: input.repeatRule } : {}),
      },
    });
  },

  async delete(userId: string, reminderId: string) {
    const existing = await prisma.smartReminder.findFirst({
      where: { id: reminderId, userId },
    });

    if (!existing) {
      throw Object.assign(new Error('Reminder not found'), { statusCode: 404 });
    }

    if (existing.isDefault) {
      throw Object.assign(new Error('Default researcher reminder cannot be deleted, but can be disabled'), {
        statusCode: 400,
      });
    }

    return prisma.smartReminder.delete({ where: { id: reminderId } });
  },
};