-- CreateEnum
CREATE TYPE "LearnerLevel" AS ENUM ('Beginner', 'Intermediate', 'Expert');

-- CreateTable
CREATE TABLE "UdemyCourse" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "categories" TEXT[],
    "topics" TEXT[],
    "promo_video_url" JSONB NOT NULL,
    "instructors" TEXT[],
    "requirements" TEXT[],
    "what_you_will_learn" TEXT[],
    "level" "LearnerLevel" NOT NULL,
    "images" JSONB NOT NULL,
    "locale" VARCHAR(6) NOT NULL,
    "primary_category" VARCHAR(100) NOT NULL,
    "primary_subcategory" VARCHAR(100) NOT NULL,
    "estimated_content_length" INTEGER NOT NULL,
    "estimated_content_length_video" INTEGER NOT NULL,
    "num_lectures" INTEGER NOT NULL,
    "num_videos" INTEGER NOT NULL,
    "last_update_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UdemyCourse_pkey" PRIMARY KEY ("id")
);
