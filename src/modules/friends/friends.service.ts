import { prisma } from '../../config/prisma.js';
import { endOfDay, startOfDay } from '../../utils/date.js';
import { notificationsService } from '../notifications/notifications.service.js';

const MAX_STREAK_PARTNERS = 5;

export const friendsService = {
  async listFriends(userId: string) {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // 1. Get follows & streaks for current user
    const [followingList, followersList, streaksInitiated, streaksReceived, todayLogs] = await Promise.all([
      prisma.userFollow.findMany({ where: { followerId: userId } }),
      prisma.userFollow.findMany({ where: { followingId: userId } }),
      prisma.streakPartner.findMany({ where: { userId } }),
      prisma.streakPartner.findMany({ where: { partnerId: userId } }),
      prisma.foodLog.findMany({
        where: { loggedAt: { gte: todayStart, lte: todayEnd } },
        select: { userId: true },
      }),
    ]);

    const followingSet = new Set(followingList.map((f) => f.followingId));
    const followerSet = new Set(followersList.map((f) => f.followerId));
    const scannedTodaySet = new Set(todayLogs.map((l) => l.userId));
    const myScannedToday = scannedTodaySet.has(userId);

    // Collect all related user IDs (following, followers, streak partners)
    const relatedUserIds = new Set<string>([
      ...followingSet,
      ...followerSet,
      ...streaksInitiated.map((s) => s.partnerId),
      ...streaksReceived.map((s) => s.userId),
    ]);

    // Also get Top 10 newest users for discovery / search
    const topNewestUsers = await prisma.user.findMany({
      where: { id: { not: userId } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true },
    });
    for (const u of topNewestUsers) {
      relatedUserIds.add(u.id);
    }

    // 2. Fetch full profiles and badges for all these users
    const allUsers = await prisma.user.findMany({
      where: { id: { in: Array.from(relatedUserIds) } },
      include: {
        profile: true,
        badges: {
          where: { isUnlocked: true },
          include: { badge: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map streak relations
    const streakMap = new Map<
      string,
      {
        status: string;
        streakDays: number;
        lastPingAt: Date | null;
        isInitiator: boolean;
      }
    >();

    for (const s of streaksInitiated) {
      streakMap.set(s.partnerId, {
        status: s.status,
        streakDays: s.streakDays,
        lastPingAt: s.lastPingAt,
        isInitiator: true,
      });
    }

    for (const s of streaksReceived) {
      const existing = streakMap.get(s.userId);
      if (!existing || existing.status !== 'active') {
        streakMap.set(s.userId, {
          status: s.status,
          streakDays: s.streakDays,
          lastPingAt: s.lastPingAt,
          isInitiator: false,
        });
      }
    }

    return allUsers.map((u) => {
      const prof = u.profile;
      const streakInfo = streakMap.get(u.id);

      const isConnected = streakInfo?.status === 'active';
      const streakDays = isConnected ? streakInfo?.streakDays ?? 1 : 0;
      const hasPendingStreakInvite = streakInfo?.status === 'pending' && !streakInfo.isInitiator;
      const isStreakInvitedByMe = streakInfo?.status === 'pending' && streakInfo.isInitiator;

      const isFollowing = followingSet.has(u.id);
      const isFollower = followerSet.has(u.id);
      const isMutual = isFollowing && isFollower;

      // Status scan harian: streak baru menyala jika KEDUA user minimal 1x scan makanan hari ini
      const partnerScannedToday = scannedTodaySet.has(u.id);
      const isStreakLitToday = isConnected && myScannedToday && partnerScannedToday;

      const badgeTitles = u.badges.map((b) => b.badge.title);

      return {
        id: u.id,
        name: prof?.name ?? u.email.split('@')[0],
        streakDays,
        isConnected,
        inviteCode: prof?.inviteCode ?? `NUT-${u.id.slice(0, 6).toUpperCase()}`,
        isFollowing,
        isFollower,
        isMutual,
        myScannedToday,
        partnerScannedToday,
        isStreakLitToday,
        lastPingTime: streakInfo?.lastPingAt?.toISOString() ?? null,
        hasPendingStreakInvite,
        isStreakInvitedByMe,
        bio: prof?.bio ?? 'Remaja Peduli Gizi Seimbang & Aktif Bergerak! 🥗',
        nutritionalStatus: 'Gizi Baik',
        xp: prof?.xp ?? 0,
        avatarLetter: prof?.avatarLetter ?? (prof?.name?.[0] ?? 'A').toUpperCase(),
        badges: badgeTitles,
      };
    });
  },

  async toggleFollow(followerId: string, targetUserId: string) {
    const existing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId: targetUserId },
      },
    });

    if (existing) {
      await prisma.userFollow.delete({ where: { id: existing.id } });

      // Jika ada streak yang aktif, otomatis akhiri streak karena syarat saling follow terputus
      await prisma.streakPartner.updateMany({
        where: {
          OR: [
            { userId: followerId, partnerId: targetUserId },
            { userId: targetUserId, partnerId: followerId },
          ],
          status: 'active',
        },
        data: {
          status: 'ended',
          streakDays: 0,
        },
      });

      return { isFollowing: false };
    } else {
      await prisma.userFollow.create({
        data: { followerId, followingId: targetUserId },
      });

      // Kirim notifikasi in-app ke target user bahwa ada pengikut baru
      const follower = await prisma.userProfile.findUnique({ where: { userId: followerId } });
      const followerName = follower?.name ?? 'Seseorang';
      await notificationsService.createNotification({
        userId: targetUserId,
        senderId: followerId,
        type: 'friend_follow',
        title: 'Pengikut Baru! 👋',
        message: `${followerName} mulai mengikutimu.`,
      }).catch((err) => console.error('Error creating follow notification:', err));

      return { isFollowing: true };
    }
  },

  async inviteStreak(userId: string, targetUserId: string) {
    // 1. Check active streak partners count (max 5)
    const activeCount = await prisma.streakPartner.count({
      where: {
        OR: [{ userId }, { partnerId: userId }],
        status: 'active',
      },
    });

    if (activeCount >= MAX_STREAK_PARTNERS) {
      throw Object.assign(new Error(`Batas maksimum rekan streak aktif adalah ${MAX_STREAK_PARTNERS} orang`), {
        statusCode: 400,
      });
    }

    // 2. Syarat streak: harus saling mengikuti (mutualan)
    const [followsThem, followsMe] = await Promise.all([
      prisma.userFollow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: targetUserId } },
      }),
      prisma.userFollow.findUnique({
        where: { followerId_followingId: { followerId: targetUserId, followingId: userId } },
      }),
    ]);

    if (!followsThem || !followsMe) {
      throw Object.assign(
        new Error('Hanya teman yang sudah saling mengikuti (mutualan) yang dapat diajak streak bersama'),
        { statusCode: 400 }
      );
    }

    // Upsert streak partner
    const existing = await prisma.streakPartner.findFirst({
      where: {
        OR: [
          { userId, partnerId: targetUserId },
          { userId: targetUserId, partnerId: userId },
        ],
      },
    });

    let result;
    if (existing) {
      result = await prisma.streakPartner.update({
        where: { id: existing.id },
        data: {
          userId,
          partnerId: targetUserId,
          status: 'pending',
        },
      });
    } else {
      result = await prisma.streakPartner.create({
        data: {
          userId,
          partnerId: targetUserId,
          status: 'pending',
          streakDays: 1,
        },
      });
    }

    // Kirim notifikasi in-app ke target user
    const sender = await prisma.userProfile.findUnique({ where: { userId } });
    const senderName = sender?.name ?? 'Temanmu';
    await notificationsService.createNotification({
      userId: targetUserId,
      senderId: userId,
      type: 'streak_invite',
      title: 'Undangan Streak Baru! 🔥',
      message: `${senderName} mengajakmu untuk streak bersama. Yuk terima undangannya!`,
    }).catch((err) => console.error('Error creating invite notification:', err));

    return result;
  },

  async acceptStreak(userId: string, targetUserId: string) {
    const activeCount = await prisma.streakPartner.count({
      where: {
        OR: [{ userId }, { partnerId: userId }],
        status: 'active',
      },
    });

    if (activeCount >= MAX_STREAK_PARTNERS) {
      throw Object.assign(new Error(`Batas maksimum rekan streak aktif adalah ${MAX_STREAK_PARTNERS} orang`), {
        statusCode: 400,
      });
    }

    const streak = await prisma.streakPartner.findFirst({
      where: {
        OR: [
          { userId, partnerId: targetUserId },
          { userId: targetUserId, partnerId: userId },
        ],
      },
    });

    if (!streak) {
      throw Object.assign(new Error('Undangan streak tidak ditemukan'), { statusCode: 404 });
    }

    const updated = await prisma.streakPartner.update({
      where: { id: streak.id },
      data: {
        status: 'active',
        streakDays: streak.streakDays > 0 ? streak.streakDays : 1,
      },
    });

    // Kirim notifikasi in-app ke target user bahwa ajakan telah diterima
    const sender = await prisma.userProfile.findUnique({ where: { userId } });
    const senderName = sender?.name ?? 'Temanmu';
    await notificationsService.createNotification({
      userId: targetUserId,
      senderId: userId,
      type: 'streak_accept',
      title: 'Streak Resmi Aktif! 🎉',
      message: `${senderName} telah menerima ajakan streak kamu! Streak kalian resmi dimulai.`,
    }).catch((err) => console.error('Error creating accept notification:', err));

    return updated;
  },

  async rejectStreak(userId: string, targetUserId: string) {
    const streak = await prisma.streakPartner.findFirst({
      where: {
        OR: [
          { userId, partnerId: targetUserId },
          { userId: targetUserId, partnerId: userId },
        ],
      },
    });

    if (streak) {
      await prisma.streakPartner.update({
        where: { id: streak.id },
        data: { status: 'rejected' },
      });

      // Kirim notifikasi in-app ke pengundang bahwa ajakan streak ditolak
      const rejector = await prisma.userProfile.findUnique({ where: { userId } });
      const rejectorName = rejector?.name ?? 'Temanmu';
      await notificationsService.createNotification({
        userId: targetUserId,
        senderId: userId,
        type: 'streak_end',
        title: 'Ajakan Streak Ditolak',
        message: `${rejectorName} menolak ajakan streak kamu.`,
      }).catch((err) => console.error('Error creating reject notification:', err));
    }
    return { success: true };
  },

  async endStreak(userId: string, targetUserId: string) {
    const streak = await prisma.streakPartner.findFirst({
      where: {
        OR: [
          { userId, partnerId: targetUserId },
          { userId: targetUserId, partnerId: userId },
        ],
      },
    });

    if (streak) {
      await prisma.streakPartner.update({
        where: { id: streak.id },
        data: {
          status: 'ended',
          streakDays: 0,
        },
      });
    }
    return { success: true };
  },

  async pingStreak(userId: string, targetUserId: string) {
    const streak = await prisma.streakPartner.findFirst({
      where: {
        OR: [
          { userId, partnerId: targetUserId },
          { userId: targetUserId, partnerId: userId },
        ],
        status: 'active',
      },
    });

    if (!streak) {
      throw Object.assign(new Error('Streak belum aktif'), { statusCode: 400 });
    }

    const updated = await prisma.streakPartner.update({
      where: { id: streak.id },
      data: { lastPingAt: new Date() },
    });

    // Kirim notifikasi in-app ke target user
    const sender = await prisma.userProfile.findUnique({ where: { userId } });
    const senderName = sender?.name ?? 'Temanmu';
    await notificationsService.createNotification({
      userId: targetUserId,
      senderId: userId,
      type: 'streak_ping',
      title: 'Pengingat Streak! 🔥',
      message: `${senderName} mengingatkanmu untuk scan makanan hari ini agar streak tetap menyala!`,
    }).catch((err) => console.error('Error creating ping notification:', err));

    return { success: true, lastPingAt: updated.lastPingAt };
  },

  async searchUsers(query: string, currentUserId: string) {
    const q = query.trim();

    // Jika tanpa query, kembalikan Top 10 user terbaru
    if (!q) {
      const newestUsers = await prisma.user.findMany({
        where: { id: { not: currentUserId } },
        include: {
          profile: true,
          badges: {
            where: { isUnlocked: true },
            include: { badge: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return newestUsers.map((u) => ({
        id: u.id,
        name: u.profile?.name ?? u.email.split('@')[0],
        inviteCode: u.profile?.inviteCode ?? `NUT-${u.id.slice(0, 6).toUpperCase()}`,
        avatarLetter: u.profile?.avatarLetter ?? (u.profile?.name?.[0] ?? 'A').toUpperCase(),
        currentStreakDays: u.profile?.currentStreakDays ?? 0,
        badges: u.badges.map((b) => b.badge.title),
      }));
    }

    // Jika dengan query, cari maksimal 10 user teratas
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { profile: { name: { contains: q, mode: 'insensitive' } } },
          { profile: { inviteCode: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: {
        profile: true,
        badges: {
          where: { isUnlocked: true },
          include: { badge: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return users.map((u) => ({
      id: u.id,
      name: u.profile?.name ?? u.email.split('@')[0],
      inviteCode: u.profile?.inviteCode ?? `NUT-${u.id.slice(0, 6).toUpperCase()}`,
      avatarLetter: u.profile?.avatarLetter ?? (u.profile?.name?.[0] ?? 'A').toUpperCase(),
      currentStreakDays: u.profile?.currentStreakDays ?? 0,
      badges: u.badges.map((b) => b.badge.title),
    }));
  },
};
