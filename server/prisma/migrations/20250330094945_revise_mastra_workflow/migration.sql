/*
  Warnings:

  - The primary key for the `mastra_workflow_snapshot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `mastra_workflow_snapshot` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "mastra_workflow_snapshot_workflow_name_run_id_key";

-- AlterTable
ALTER TABLE "mastra_workflow_snapshot" DROP CONSTRAINT "mastra_workflow_snapshot_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "mastra_workflow_snapshot_pkey" PRIMARY KEY ("workflow_name", "run_id");
