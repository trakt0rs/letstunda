-- Replace the single deadline with an allowed run window ("HH:MM" in Riga time).
-- The old deadline becomes the end of the window, so existing data is kept.
ALTER TABLE "devices" RENAME COLUMN "deadline" TO "runUntil";
ALTER TABLE "devices" ADD COLUMN "runFrom" TEXT;
