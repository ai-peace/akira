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
CREATE TABLE "prompt_groups" (
    "id" SERIAL NOT NULL,
    "unique_key" TEXT NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" SERIAL NOT NULL,
    "unique_key" TEXT NOT NULL,
    "promptGroupId" INTEGER,
    "result" JSONB,
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
CREATE INDEX "prompt_groups_unique_key_idx" ON "prompt_groups"("unique_key");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_groups_unique_key_key" ON "prompt_groups"("unique_key");

-- CreateIndex
CREATE INDEX "prompts_unique_key_idx" ON "prompts"("unique_key");

-- CreateIndex
CREATE UNIQUE INDEX "prompts_unique_key_key" ON "prompts"("unique_key");

-- AddForeignKey
ALTER TABLE "prompt_groups" ADD CONSTRAINT "prompt_groups_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_promptGroupId_fkey" FOREIGN KEY ("promptGroupId") REFERENCES "prompt_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
