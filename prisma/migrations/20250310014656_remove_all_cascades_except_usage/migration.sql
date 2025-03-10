-- DropForeignKey
ALTER TABLE "user_prompt_usage" DROP CONSTRAINT "user_prompt_usage_user_id_fkey";

-- AddForeignKey
ALTER TABLE "user_prompt_usage" ADD CONSTRAINT "user_prompt_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
