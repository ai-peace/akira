/*
  Warnings:

  - You are about to drop the `mastra_workflow_snapshots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "mastra_workflow_snapshots";

-- CreateTable
CREATE TABLE "mastra_workflow_snapshot" (
    "workflow_name" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "snapshot" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mastra_workflow_snapshot_pkey" PRIMARY KEY ("run_id")
);

-- CreateIndex
CREATE INDEX "mastra_workflow_snapshot_workflow_name_idx" ON "mastra_workflow_snapshot"("workflow_name");
