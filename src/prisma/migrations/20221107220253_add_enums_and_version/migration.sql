/*
  Warnings:

  - The primary key for the `UdemyCourse` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `data_version` to the `UdemyCourse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "LearnerLevel" ADD VALUE 'All Levels';

-- AlterTable
ALTER TABLE "UdemyCourse" DROP CONSTRAINT "UdemyCourse_pkey",
ADD COLUMN     "data_version" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "primary_category" DROP NOT NULL,
ALTER COLUMN "primary_subcategory" DROP NOT NULL,
ADD CONSTRAINT "UdemyCourse_pkey" PRIMARY KEY ("id", "data_version");

-- CreateTable
CREATE TABLE "DataVersion" (
    "version" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataVersion_pkey" PRIMARY KEY ("version")
);
