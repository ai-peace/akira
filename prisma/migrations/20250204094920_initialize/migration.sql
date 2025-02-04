-- CreateEnum
CREATE TYPE "LlmStatus" AS ENUM ('IDLE', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "chats" (
    "id" SERIAL NOT NULL,
    "unique_key" TEXT NOT NULL,
    "title" TEXT,
    "mdx_content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" SERIAL NOT NULL,
    "unique_key" TEXT NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "main_prompt" TEXT,
    "result" TEXT,
    "result_type" TEXT,
    "llm_status" "LlmStatus" NOT NULL DEFAULT 'IDLE',
    "llm_status_change_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "llm_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chats_unique_key_idx" ON "chats"("unique_key");

-- CreateIndex
CREATE UNIQUE INDEX "chats_unique_key_key" ON "chats"("unique_key");

-- CreateIndex
CREATE INDEX "prompts_unique_key_idx" ON "prompts"("unique_key");

-- CreateIndex
CREATE INDEX "prompts_chat_id_idx" ON "prompts"("chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "prompts_unique_key_key" ON "prompts"("unique_key");

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
