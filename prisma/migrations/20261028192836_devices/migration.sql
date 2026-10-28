-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "powerKw" DOUBLE PRECISION NOT NULL,
    "splittable" BOOLEAN NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "devices_userId_idx" ON "devices"("userId");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
