-- CreateTable
CREATE TABLE "Metrics" (
    "id" SERIAL NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalGames" INTEGER NOT NULL,
    "avgDurationMs" INTEGER NOT NULL,
    "winnerCounts" JSONB NOT NULL,
    "gamesPerDay" JSONB NOT NULL,
    "gamesPerHour" JSONB NOT NULL,
    "userStats" JSONB NOT NULL,

    CONSTRAINT "Metrics_pkey" PRIMARY KEY ("id")
);
