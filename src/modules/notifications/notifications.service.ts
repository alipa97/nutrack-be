import { prisma } from '../../config/prisma.js';

export const notificationsService = {
  async getUnreadNotifications(userId: string) {
    const notifications = await prisma.userNotification.findMany({
      where: {
        userId,
        isRead: false,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      senderId: n.senderId,
      senderName: n.sender?.profile?.name ?? n.sender?.email?.split('@')[0] ?? 'Teman',
      senderAvatar: n.sender?.profile?.avatarLetter ?? 'A',
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
  },

  async markAsRead(userId: string, notificationIds?: string[]) {
    if (notificationIds && notificationIds.length > 0) {
      await prisma.userNotification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
        },
        data: {
          isRead: true,
        },
      });
    } else {
      await prisma.userNotification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    }

    return { success: true };
  },

  async createNotification(params: {
    userId: string;
    senderId?: string;
    type: string;
    title: string;
    message: string;
  }) {
    return prisma.userNotification.create({
      data: {
        userId: params.userId,
        senderId: params.senderId,
        type: params.type,
        title: params.title,
        message: params.message,
        isRead: false,
      },
    });
  },
};
