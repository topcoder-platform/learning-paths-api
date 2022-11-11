-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('available', 'coming_soon', 'not_available', 'removed');

-- CreateTable
CREATE TABLE "TopcoderUdemyCourse" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'available',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "TopcoderUdemyCourse_pkey" PRIMARY KEY ("id")
);
