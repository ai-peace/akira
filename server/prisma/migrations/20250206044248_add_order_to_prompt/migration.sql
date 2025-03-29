-- AlterTable
ALTER TABLE "prompts" ADD COLUMN     "order" SERIAL NOT NULL;

-- CreateIndex
CREATE INDEX "prompt_groups_chat_id_idx" ON "prompt_groups"("chat_id");

-- CreateIndex
CREATE INDEX "prompts_promptGroupId_idx" ON "prompts"("promptGroupId");

-- CreateIndex
CREATE INDEX "prompts_promptGroupId_order_idx" ON "prompts"("promptGroupId", "order");
