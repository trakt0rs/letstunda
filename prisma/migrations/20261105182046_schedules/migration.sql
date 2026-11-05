-- CreateTable
CREATE TABLE "schedules" (
    "deviceId" TEXT NOT NULL,
    "windows" JSONB NOT NULL,
    "energyKwh" DOUBLE PRECISION NOT NULL,
    "avgPrice" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "rating" TEXT,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("deviceId")
);

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
