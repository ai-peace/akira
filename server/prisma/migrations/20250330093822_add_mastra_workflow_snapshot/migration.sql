-- CreateTable
CREATE TABLE "mastra_workflow_snapshots" (
    "workflow_name" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "snapshot" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mastra_workflow_snapshots_pkey" PRIMARY KEY ("run_id")
);

-- CreateIndex
CREATE INDEX "mastra_workflow_snapshots_workflow_name_idx" ON "mastra_workflow_snapshots"("workflow_name");
