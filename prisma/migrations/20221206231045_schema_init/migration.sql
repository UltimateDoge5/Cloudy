-- CreateTable
CREATE TABLE "Weather" (
    "id" SERIAL NOT NULL,
    "temp" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Weather_pkey" PRIMARY KEY ("id")
);
