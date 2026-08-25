-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "auth_provider_id" TEXT NOT NULL DEFAULT 'local',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "height_cm" DOUBLE PRECISION NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_measurement_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "height_cm" DOUBLE PRECISION NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "bmi_category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_measurement_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_catalog" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "food_group_id" UUID NOT NULL,
    "default_image_url" TEXT,
    "source" TEXT NOT NULL DEFAULT 'system',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "food_catalog_id" UUID,
    "food_name" TEXT NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "image_url" TEXT,
    "is_ai_detected" BOOLEAN NOT NULL DEFAULT false,
    "ai_confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hydration_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount_ml" INTEGER NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hydration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smart_reminders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reminder_time" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "icon_key" TEXT,
    "repeat_rule" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smart_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_key" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "unlocked_at" TIMESTAMP(3),
    "is_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_challenges" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "reward_xp" INTEGER NOT NULL,
    "target_days" INTEGER NOT NULL DEFAULT 7,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_on" DATE,
    "ends_on" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_weekly_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "week_start" DATE NOT NULL,
    "current_days" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "last_progress_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_weekly_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bct_recommendations" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "technique_name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "full_content" TEXT NOT NULL,
    "icon_key" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bct_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bct_completions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bct_recommendation_id" UUID NOT NULL,
    "completion_date" DATE NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_bct_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_measurement_history_user_id_measured_at_idx" ON "user_measurement_history"("user_id", "measured_at");

-- CreateIndex
CREATE UNIQUE INDEX "food_groups_name_key" ON "food_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "food_catalog_name_key" ON "food_catalog"("name");

-- CreateIndex
CREATE INDEX "food_catalog_food_group_id_idx" ON "food_catalog"("food_group_id");

-- CreateIndex
CREATE INDEX "food_logs_user_id_logged_at_idx" ON "food_logs"("user_id", "logged_at");

-- CreateIndex
CREATE INDEX "hydration_logs_user_id_logged_at_idx" ON "hydration_logs"("user_id", "logged_at");

-- CreateIndex
CREATE INDEX "smart_reminders_user_id_is_enabled_idx" ON "smart_reminders"("user_id", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "user_weekly_challenges_user_id_week_start_idx" ON "user_weekly_challenges"("user_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "user_weekly_challenges_user_id_challenge_id_week_start_key" ON "user_weekly_challenges"("user_id", "challenge_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "user_bct_completions_user_id_bct_recommendation_id_completi_key" ON "user_bct_completions"("user_id", "bct_recommendation_id", "completion_date");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_measurement_history" ADD CONSTRAINT "user_measurement_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_catalog" ADD CONSTRAINT "food_catalog_food_group_id_fkey" FOREIGN KEY ("food_group_id") REFERENCES "food_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_food_catalog_id_fkey" FOREIGN KEY ("food_catalog_id") REFERENCES "food_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hydration_logs" ADD CONSTRAINT "hydration_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smart_reminders" ADD CONSTRAINT "smart_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_weekly_challenges" ADD CONSTRAINT "user_weekly_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_weekly_challenges" ADD CONSTRAINT "user_weekly_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "weekly_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bct_completions" ADD CONSTRAINT "user_bct_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bct_completions" ADD CONSTRAINT "user_bct_completions_bct_recommendation_id_fkey" FOREIGN KEY ("bct_recommendation_id") REFERENCES "bct_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
