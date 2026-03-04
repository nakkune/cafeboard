-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "conversation_id" INTEGER,
ALTER COLUMN "channel_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
