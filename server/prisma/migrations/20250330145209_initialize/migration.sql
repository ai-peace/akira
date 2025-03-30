-- CreateEnum
CREATE TYPE "LlmStatus" AS ENUM ('IDLE', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "WaitListStatus" AS ENUM ('WAITING', 'INVITED', 'REGISTERED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "unique_key" VARCHAR(255) NOT NULL,
    "privy_id" VARCHAR(255) NOT NULL,
    "solana_system_account_address" VARCHAR(255),
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "login_method" VARCHAR(255) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_prompt_usage" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_prompt_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" SERIAL NOT NULL,
    "unique_key" TEXT NOT NULL,
    "user_id" INTEGER,
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
    "order" SERIAL,
    "result" JSONB,
    "result_type" TEXT,
    "llm_status" "LlmStatus" NOT NULL DEFAULT 'IDLE',
    "llm_status_change_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "llm_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "mastra_workflow_snapshot" (
    "workflow_name" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "snapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mastra_workflow_snapshot_pkey" PRIMARY KEY ("workflow_name","run_id")
);

-- CreateIndex
CREATE INDEX "users_unique_key" ON "users"("unique_key");

-- CreateIndex
CREATE INDEX "users_privyid_unique" ON "users"("privy_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_unique_key_key" ON "users"("unique_key");

-- CreateIndex
CREATE UNIQUE INDEX "users_privy_id_key" ON "users"("privy_id");

-- CreateIndex
CREATE INDEX "user_prompt_usage_user_id_idx" ON "user_prompt_usage"("user_id");

-- CreateIndex
CREATE INDEX "user_prompt_usage_user_id_date_idx" ON "user_prompt_usage"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_prompt_usage_user_id_date_key" ON "user_prompt_usage"("user_id", "date");

-- CreateIndex
CREATE INDEX "chats_unique_key_idx" ON "chats"("unique_key");

-- CreateIndex
CREATE UNIQUE INDEX "chats_unique_key_key" ON "chats"("unique_key");

-- CreateIndex
CREATE INDEX "prompt_groups_unique_key_idx" ON "prompt_groups"("unique_key");

-- CreateIndex
CREATE INDEX "prompt_groups_chat_id_idx" ON "prompt_groups"("chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_groups_unique_key_key" ON "prompt_groups"("unique_key");

-- CreateIndex
CREATE INDEX "prompts_unique_key_idx" ON "prompts"("unique_key");

-- CreateIndex
CREATE INDEX "prompts_promptGroupId_idx" ON "prompts"("promptGroupId");

-- CreateIndex
CREATE INDEX "prompts_promptGroupId_order_idx" ON "prompts"("promptGroupId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "prompts_unique_key_key" ON "prompts"("unique_key");

-- CreateIndex
CREATE INDEX "waitlists_email_idx" ON "waitlists"("email");

-- CreateIndex
CREATE INDEX "waitlists_status_idx" ON "waitlists"("status");

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_unique_key_key" ON "waitlists"("unique_key");

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_email_key" ON "waitlists"("email");

-- AddForeignKey
ALTER TABLE "user_prompt_usage" ADD CONSTRAINT "user_prompt_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_groups" ADD CONSTRAINT "prompt_groups_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_promptGroupId_fkey" FOREIGN KEY ("promptGroupId") REFERENCES "prompt_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
