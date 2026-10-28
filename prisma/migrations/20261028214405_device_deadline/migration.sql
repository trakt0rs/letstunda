/*
  Warnings:

  - You are about to drop the column `finishedAt` on the `devices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "devices" DROP COLUMN "finishedAt",
ADD COLUMN     "deadline" TEXT;
