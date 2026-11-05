/*
  Warnings:

  - You are about to drop the column `avgPrice` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `endsAt` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `energyKwh` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `windows` on the `schedules` table. All the data in the column will be lost.
  - Added the required column `options` to the `schedules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "schedules" DROP COLUMN "avgPrice",
DROP COLUMN "cost",
DROP COLUMN "endsAt",
DROP COLUMN "energyKwh",
DROP COLUMN "rating",
DROP COLUMN "windows",
ADD COLUMN     "options" JSONB NOT NULL;
