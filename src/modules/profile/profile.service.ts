import { prisma } from '../../config/prisma.js';
import {
  calculateAge,
  calculateBmi,
  calculateTargetWaterMl,
  getBctAdvice,
  getNutritionalStatus,
} from '../../utils/bmi.js';

type UpdateProfileInput = {
  name?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  heightCm?: number;
  weightKg?: number;
};

export const profileService = {
  async getCurrent(userId: string) {
    const [user, latestMeasurement, measurementHistory] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.userMeasurementHistory.findFirst({
        where: { userId },
        orderBy: { measuredAt: 'desc' },
      }),
      prisma.userMeasurementHistory.findMany({
        where: { userId },
        orderBy: { measuredAt: 'desc' },
        take: 12,
      }),
    ]);

    if (!user || !user.profile) {
      throw Object.assign(new Error('Profile not found'), { statusCode: 404 });
    }

    const age = calculateAge(user.profile.birthDate);
    const bmi = calculateBmi(user.profile.weightKg, user.profile.heightCm);
    const nutritionalStatus = getNutritionalStatus(bmi);
    const targetWaterMl = calculateTargetWaterMl(user.profile.gender, age.years);
    const bctAdvice = getBctAdvice(nutritionalStatus.key);

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      profile: {
        ...user.profile,
        ageYears: age.years,
        ageMonths: age.months,
        totalAgeMonths: age.totalMonths,
        ageFormatted: age.formatted,
        bmi,
        nutritionalStatus: nutritionalStatus.key,
        nutritionalStatusLabel: nutritionalStatus.label,
        targetWaterMl,
        bctAdvice,
      },
      latestMeasurement,
      measurementHistory,
    };
  },

  async createOrUpdate(userId: string, input: UpdateProfileInput) {
    const existing = await prisma.userProfile.findUnique({ where: { userId } });

    const nextHeight = input.heightCm ?? existing?.heightCm ?? 155;
    const nextWeight = input.weightKg ?? existing?.weightKg ?? 44;
    const nextGender = input.gender ?? existing?.gender ?? 'female';
    const nextBirthDate = input.birthDate ? new Date(input.birthDate) : (existing?.birthDate ?? new Date(2012, 4, 2));

    const bmi = calculateBmi(nextWeight, nextHeight);
    const nutritionalStatus = getNutritionalStatus(bmi);

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        name: input.name ?? 'Remaja Nutrack',
        birthDate: nextBirthDate,
        gender: nextGender,
        heightCm: nextHeight,
        weightKg: nextWeight,
        inviteCode: `NUT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        avatarLetter: (input.name?.[0] ?? 'R').toUpperCase(),
        school: 'SMA Negeri 1 Jakarta',
        xp: 0,
      },
      update: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.birthDate ? { birthDate: nextBirthDate } : {}),
        ...(input.gender ? { gender: nextGender } : {}),
        ...(input.heightCm !== undefined ? { heightCm: input.heightCm } : {}),
        ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
      },
    });

    // Create measurement history entry
    const measurement = await prisma.userMeasurementHistory.create({
      data: {
        userId,
        heightCm: nextHeight,
        weightKg: nextWeight,
        bmi,
        bmiCategory: nutritionalStatus.label,
      },
    });

    const age = calculateAge(profile.birthDate);
    const targetWaterMl = calculateTargetWaterMl(profile.gender, age.years);
    const bctAdvice = getBctAdvice(nutritionalStatus.key);

    return {
      profile: {
        ...profile,
        ageYears: age.years,
        ageMonths: age.months,
        totalAgeMonths: age.totalMonths,
        ageFormatted: age.formatted,
        bmi,
        nutritionalStatus: nutritionalStatus.key,
        nutritionalStatusLabel: nutritionalStatus.label,
        targetWaterMl,
        bctAdvice,
      },
      measurement,
    };
  },
};