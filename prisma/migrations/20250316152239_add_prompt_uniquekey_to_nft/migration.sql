-- AlterTable
ALTER TABLE "nfts" ADD COLUMN     "prompt_group_unique_key" VARCHAR(255);

-- CreateIndex
CREATE INDEX "nfts_prompt_group_unique_key_idx" ON "nfts"("prompt_group_unique_key");
