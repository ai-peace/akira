-- CreateEnum
CREATE TYPE "LlmStatus" AS ENUM ('IDLE', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "chats" (
    "id" SERIAL NOT NULL,
    "unique_key" TEXT NOT NULL,
    "title" TEXT,
    "mdx_content" TEXT,
    "llm_status" "LlmStatus" NOT NULL DEFAULT 'IDLE',
    "llm_status_change_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "llm_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chats_unique_key_idx" ON "chats"("unique_key");

-- CreateIndex
CREATE UNIQUE INDEX "chats_unique_key_key" ON "chats"("unique_key");
