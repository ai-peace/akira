-- CreateEnum
CREATE TYPE "WaitListStatus" AS ENUM ('WAITING', 'INVITED', 'REGISTERED');

-- CreateTable
CREATE TABLE "waitlists" (
    "id" SERIAL NOT NULL,
    "unique_key" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "status" "WaitListStatus" NOT NULL DEFAULT 'WAITING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waitlists_email_idx" ON "waitlists"("email");

-- CreateIndex
CREATE INDEX "waitlists_status_idx" ON "waitlists"("status");

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_unique_key_key" ON "waitlists"("unique_key");

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_email_key" ON "waitlists"("email");
