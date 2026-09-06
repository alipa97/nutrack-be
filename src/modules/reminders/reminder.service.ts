import { prisma } from '../../config/prisma.js';

export type ReminderInput = {
  title: string;
  description: string;
  reminderTime: string;
  category?: string;
  subType?: string;
  optionNumber?: number;
  templateId?: string;
  isEnabled?: boolean;
  iconKey?: string;
  repeatRule?: string;
};

export const reminderService = {
  /**
   * Returns all 10 official master templates from Client PDF.
   */
  async getTemplates() {
    return prisma.reminderTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ reminderTime: 'asc' }, { optionNumber: 'asc' }],
    });
  },

  /**
   * Lists all reminders for a user: template-based + custom.
   * Auto-seeds 5 default time slots (option 1) if user has none yet.
   */
  async list(userId: string) {
    // 1. Get user's existing reminders
    let reminders = await prisma.smartReminder.findMany({
      where: { userId },
      orderBy: { reminderTime: 'asc' },
    });

    // 2. Auto-seed default reminders (5 time slots, option 1 from templates) if user has none
    const existingTemplateLinks = reminders.filter((r) => r.templateId !== null);

    if (existingTemplateLinks.length === 0) {
      const templates = await prisma.reminderTemplate.findMany({
        where: { isActive: true, optionNumber: 1 },
        orderBy: { reminderTime: 'asc' },
      });

      if (templates.length > 0) {
        await prisma.smartReminder.createMany({
          data: templates.map((t) => ({
            userId,
            templateId: t.id,
            category: t.category,
            subType: t.subType,
            optionNumber: t.optionNumber,
            title: t.title,
            description: t.description,
            reminderTime: t.reminderTime,
            iconKey: t.iconKey,
            isEnabled: true,
          })),
        });

        // Re-fetch after seeding
        reminders = await prisma.smartReminder.findMany({
          where: { userId },
          orderBy: { reminderTime: 'asc' },
        });
      }
    }

    // 3. Return with isDefault flag derived from templateId presence
    // User requirement: Default template reminders first (chronological), followed by custom smart reminders
    const defaults = reminders
      .filter((r) => r.templateId !== null)
      .sort((a, b) => a.reminderTime.localeCompare(b.reminderTime));
    const custom = reminders
      .filter((r) => r.templateId === null)
      .sort((a, b) => a.reminderTime.localeCompare(b.reminderTime));
    const sorted = [...defaults, ...custom];

    return sorted.map((r) => ({
      ...r,
      isDefault: r.templateId !== null,
    }));
  },

  /**
   * Creates a custom reminder (no template link).
   */
  async create(userId: string, input: ReminderInput) {
    const created = await prisma.smartReminder.create({
      data: {
        userId,
        templateId: null, // Custom reminder
        category: input.category ?? 'Kustom',
        subType: input.subType,
        optionNumber: null,
        title: input.title,
        description: input.description,
        reminderTime: input.reminderTime,
        isEnabled: input.isEnabled ?? true,
        iconKey: input.iconKey,
        repeatRule: input.repeatRule,
      },
    });

    return {
      ...created,
      isDefault: false,
    };
  },

  /**
   * Updates a reminder.
   * - Template-based: allow toggling isEnabled, and switching optionNumber (1 <-> 2).
   * - Custom: allow editing all fields.
   */
  async update(userId: string, reminderId: string, input: Partial<ReminderInput>) {
    const existing = await prisma.smartReminder.findFirst({
      where: { id: reminderId, userId },
    });

    if (!existing) {
      throw Object.assign(new Error('Reminder not found'), { statusCode: 404 });
    }

    // Template-based reminder
    if (existing.templateId) {
      // If user switches optionNumber (e.g. 1 -> 2 or 2 -> 1)
      if (input.optionNumber && input.optionNumber !== existing.optionNumber) {
        const targetTemplate = await prisma.reminderTemplate.findFirst({
          where: {
            reminderTime: existing.reminderTime,
            optionNumber: input.optionNumber,
            category: existing.category,
          },
        });

        if (targetTemplate) {
          const updated = await prisma.smartReminder.update({
            where: { id: reminderId },
            data: {
              templateId: targetTemplate.id,
              optionNumber: targetTemplate.optionNumber,
              title: targetTemplate.title,
              description: targetTemplate.description,
              iconKey: targetTemplate.iconKey,
              ...(typeof input.isEnabled === 'boolean' ? { isEnabled: input.isEnabled } : {}),
            },
          });
          return {
            ...updated,
            isDefault: updated.templateId !== null,
          };
        }
      }

      // Just toggle isEnabled
      const updated = await prisma.smartReminder.update({
        where: { id: reminderId },
        data: {
          ...(typeof input.isEnabled === 'boolean' ? { isEnabled: input.isEnabled } : {}),
        },
      });
      return {
        ...updated,
        isDefault: updated.templateId !== null,
      };
    }

    // Custom reminder: allow editing all fields
    const updated = await prisma.smartReminder.update({
      where: { id: reminderId },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.reminderTime ? { reminderTime: input.reminderTime } : {}),
        ...(typeof input.isEnabled === 'boolean' ? { isEnabled: input.isEnabled } : {}),
        ...(input.category ? { category: input.category } : {}),
        ...(input.subType ? { subType: input.subType } : {}),
        ...(input.iconKey !== undefined ? { iconKey: input.iconKey } : {}),
        ...(input.repeatRule !== undefined ? { repeatRule: input.repeatRule } : {}),
      },
    });
    return {
      ...updated,
      isDefault: updated.templateId !== null,
    };
  },

  /**
   * Deletes a reminder.
   * - Template-based reminders CANNOT be deleted (only disabled via update).
   * - Custom reminders can be deleted.
   */
  async delete(userId: string, reminderId: string) {
    const existing = await prisma.smartReminder.findFirst({
      where: { id: reminderId, userId },
    });

    if (!existing) {
      throw Object.assign(new Error('Reminder not found'), { statusCode: 404 });
    }

    if (existing.templateId) {
      throw Object.assign(new Error('Template-based reminder cannot be deleted, but can be disabled'), {
        statusCode: 400,
      });
    }

    return prisma.smartReminder.delete({ where: { id: reminderId } });
  },
};