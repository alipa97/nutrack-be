import { prisma } from '../../config/prisma.js';
import { endOfDay, startOfDay, toDateOnlyString } from '../../utils/date.js';
import { calculatePartnerStreak } from '../../utils/streak.js';
import { notificationsService } from '../notifications/notifications.service.js';

const MAX_STREAK_PARTNERS = 5;

export const friendsService = {
  async listFriends(userId: string) {
    // 1. Get follows & streaks for current user
    const [followingList, followersList, streaksInitiated, streaksReceived] = await Promise.all([
      prisma.userFollow.findMany({ where: { followerId: userId } }),
      prisma.userFollow.findMany({ where: { followingId: userId } }),
      prisma.streakPartner.findMany({ where: { userId } }),
      prisma.streakPartner.findMany({ where: { partnerId: userId } }),
    ]);

    const followingSet = new Set(followingList.map((f) => f.followingId));
    const followerSet = new Set(followersList.map((f) => f.followerId));

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

    // Fetch food logs for current user and all related users to evaluate daily scans & partner streaks
    const relevantUserIds = Array.from(new Set([userId, ...relatedUserIds]));
    const foodLogs = await prisma.foodLog.findMany({
      where: { userId: { in: relevantUserIds } },
      select: { userId: true, loggedAt: true },
      orderBy: { loggedAt: 'desc' },
    });

    const logsByUser = new Map<string, Date[]>();
    for (const log of foodLogs) {
      const list = logsByUser.get(log.userId) || [];
      list.push(log.loggedAt);
      logsByUser.set(log.userId, list);
    }
    const myLogs = logsByUser.get(userId) || [];

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

    // Fetch pings sent by the current user (userId) within the last 24 hours
    // This ensures only the SENDER sees the button as "Terkirim", while recipient sees "Ingatkan"
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const mySentPings = await prisma.userNotification.findMany({
      where: {
        senderId: userId,
        type: 'streak_ping',
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: 'desc' },
      select: { userId: true, createdAt: true },
    });

    const myPingTimeByFriendId = new Map<string, Date>();
    for (const p of mySentPings) {
      if (!myPingTimeByFriendId.has(p.userId)) {
        myPingTimeByFriendId.set(p.userId, p.createdAt);
      }
    }

    // Map streak relations with dynamic streak calculation
    const streakMap = new Map<
      string,
      {
        id: string;
        status: string;
        streakDays: number;
        lastPingAt: Date | null;
        isInitiator: boolean;
        isStreakLitToday: boolean;
        myScannedToday: boolean;
        partnerScannedToday: boolean;
      }
    >();

    const allStreaks = [
      ...streaksInitiated.map((s) => ({ ...s, partnerUserId: s.partnerId, isInitiator: true })),
      ...streaksReceived.map((s) => ({ ...s, partnerUserId: s.userId, isInitiator: false })),
    ];

    for (const s of allStreaks) {
      const pLogs = logsByUser.get(s.partnerUserId) || [];
      const streakCalc = calculatePartnerStreak(myLogs, pLogs);

      const isConnected = s.status === 'active';
      const effectiveStreakDays = isConnected ? streakCalc.streakDays : 0;

      // Sync streakDays to DB if changed
      if (isConnected && s.streakDays !== effectiveStreakDays) {
        prisma.streakPartner.update({
          where: { id: s.id },
          data: { streakDays: effectiveStreakDays },
        }).catch((err) => console.error('Failed to sync streakDays to DB:', err));
      }

      const existing = streakMap.get(s.partnerUserId);
      if (!existing || s.status === 'active') {
        streakMap.set(s.partnerUserId, {
          id: s.id,
          status: s.status,
          streakDays: effectiveStreakDays,
          lastPingAt: s.lastPingAt,
          isInitiator: s.isInitiator,
          isStreakLitToday: isConnected && streakCalc.isStreakLitToday,
          myScannedToday: streakCalc.myScannedToday,
          partnerScannedToday: streakCalc.partnerScannedToday,
        });
      }
    }

    const todayStr = toDateOnlyString(new Date());

    return allUsers.map((u) => {
      const prof = u.profile;
      const streakInfo = streakMap.get(u.id);

      const isConnected = streakInfo?.status === 'active';
      const streakDays = isConnected ? streakInfo.streakDays : 0;
      const hasPendingStreakInvite = streakInfo?.status === 'pending' && !streakInfo.isInitiator;
      const isStreakInvitedByMe = streakInfo?.status === 'pending' && streakInfo.isInitiator;

      const isFollowing = followingSet.has(u.id);
      const isFollower = followerSet.has(u.id);
      const isMutual = isFollowing && isFollower;

      // Status scan harian
      const uLogs = logsByUser.get(u.id) || [];
      const partnerScannedToday = streakInfo
        ? streakInfo.partnerScannedToday
        : uLogs.some((d) => toDateOnlyString(d) === todayStr);
      const myScannedToday = myLogs.some((d) => toDateOnlyString(d) === todayStr);
      const isStreakLitToday = isConnected && (streakInfo?.isStreakLitToday ?? false);

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
        lastPingTime: myPingTimeByFriendId.get(u.id)?.toISOString() ?? null,
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

    // Cegah spam: periksa apakah pengirim sudah mengirim ping ke teman ini dalam 12 jam terakhir
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existingRecentPing = await prisma.userNotification.findFirst({
      where: {
        senderId: userId,
        userId: targetUserId,
        type: 'streak_ping',
        createdAt: { gte: twelveHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingRecentPing) {
      return { success: true, lastPingAt: existingRecentPing.createdAt };
    }

    const now = new Date();
    await prisma.streakPartner.update({
      where: { id: streak.id },
      data: { lastPingAt: now },
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

    return { success: true, lastPingAt: now };
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

  async syncPartnerStreaksForUser(userId: string) {
    const activeStreaks = await prisma.streakPartner.findMany({
      where: {
        OR: [{ userId }, { partnerId: userId }],
        status: 'active',
      },
    });

    if (activeStreaks.length === 0) return;

    const partnerIds = activeStreaks.map((s) => (s.userId === userId ? s.partnerId : s.userId));
    const allUserIds = Array.from(new Set([userId, ...partnerIds]));

    const logs = await prisma.foodLog.findMany({
      where: { userId: { in: allUserIds } },
      select: { userId: true, loggedAt: true },
      orderBy: { loggedAt: 'desc' },
    });

    const logsByUser = new Map<string, Date[]>();
    for (const l of logs) {
      const list = logsByUser.get(l.userId) || [];
      list.push(l.loggedAt);
      logsByUser.set(l.userId, list);
    }
    const myLogs = logsByUser.get(userId) || [];

    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const userName = userProfile?.name ?? 'Temanmu';

    for (const s of activeStreaks) {
      const pId = s.userId === userId ? s.partnerId : s.userId;
      const pLogs = logsByUser.get(pId) || [];
      const res = calculatePartnerStreak(myLogs, pLogs);

      if (s.streakDays !== res.streakDays) {
        await prisma.streakPartner.update({
          where: { id: s.id },
          data: { streakDays: res.streakDays },
        });

        // Jika streak hari ini baru saja menyala dan bertambah, kirim notifikasi ke rekan
        if (res.isStreakLitToday && res.streakDays > 0) {
          await notificationsService.createNotification({
            userId: pId,
            senderId: userId,
            type: 'streak_accept',
            title: 'Streak Menyala! 🔥',
            message: `${userName} baru saja scan makanan! Streak kalian hari ini resmi menyala (${res.streakDays} Hari).`,
          }).catch(() => {});
        }
      }
    }
  },
};

