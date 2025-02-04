/*
  Warnings:

  - The `result` column on the `prompts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "prompts" DROP COLUMN "result",
ADD COLUMN     "result" JSONB;
