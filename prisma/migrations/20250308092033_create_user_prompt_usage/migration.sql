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

-- CreateIndex
CREATE INDEX "user_prompt_usage_user_id_idx" ON "user_prompt_usage"("user_id");

-- CreateIndex
CREATE INDEX "user_prompt_usage_user_id_date_idx" ON "user_prompt_usage"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_prompt_usage_user_id_date_key" ON "user_prompt_usage"("user_id", "date");

-- AddForeignKey
ALTER TABLE "user_prompt_usage" ADD CONSTRAINT "user_prompt_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
