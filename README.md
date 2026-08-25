# nutrack-be

Backend NUTRACK berbasis Node.js, Express, TypeScript, Prisma, PostgreSQL, dan JWT.

## Struktur awal

- `src/modules/auth` untuk register, login, dan endpoint `me`
- `src/config` untuk env dan Prisma client
- `src/utils` untuk JWT, password hash, BMI, dan wrapper async
- `prisma/schema.prisma` untuk seluruh ERD utama
- `prisma/seed.ts` untuk data master awal

## Endpoint awal

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

## Langkah pakai

1. Salin `.env.example` menjadi `.env`
2. Jalankan PostgreSQL via `docker compose up -d`
3. Install dependency
4. Jalankan `npx prisma migrate dev`
5. Jalankan `npm run dev`

## Catatan desain

Skema Prisma mengikuti tabel yang kamu definisikan: users, user_profiles, user_measurement_history, food_catalog, food_logs, hydration_logs, smart_reminders, badges, user_badges, weekly_challenges, user_weekly_challenges, bct_recommendations, dan user_bct_completions.