import { prisma } from '../../config/prisma.js';
import { calculateBmi, getBmiCategory } from '../../utils/bmi.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { signAccessToken } from '../../utils/jwt.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw Object.assign(new Error('Email already registered'), { statusCode: 400 });
    }

    const passwordHash = await hashPassword(input.password);

    const hasExplicitProfileData = Boolean(
      input.birthDate && input.gender && input.heightCm && input.weightKg
    );

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          authProviderId: 'local',
          ...(hasExplicitProfileData
            ? {
                profile: {
                  create: {
                    name: input.name,
                    birthDate: new Date(input.birthDate!),
                    gender: input.gender!,
                    heightCm: input.heightCm!,
                    weightKg: input.weightKg!,
                    inviteCode: `NUT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                    avatarLetter: (input.name?.[0] ?? 'R').toUpperCase(),
                    school: 'SMA Negeri 1 Jakarta',
                    xp: 0,
                  },
                },
                measurementHistory: {
                  create: {
                    measuredAt: new Date(),
                    heightCm: input.heightCm!,
                    weightKg: input.weightKg!,
                    bmi: calculateBmi(input.weightKg!, input.heightCm!),
                    bmiCategory: getBmiCategory(calculateBmi(input.weightKg!, input.heightCm!)),
                  },
                },
              }
            : {}),
        },
        include: { profile: true },
      });

      return user;
    });

    const hasProfile = Boolean(createdUser.profile);

    return {
      token: signAccessToken({ sub: createdUser.id, email: createdUser.email }),
      user: createdUser,
      hasProfile,
    };
  },


  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    const hasProfile = Boolean(user.profile);

    return {
      token: signAccessToken({ sub: user.id, email: user.email }),
      user,
      hasProfile,
    };
  },


  async me(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        measurementHistory: {
          orderBy: { measuredAt: 'desc' },
          take: 10,
        },
      },
    });
  },
};