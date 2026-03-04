-- CreateEnum
CREATE TYPE "MemberLevel" AS ENUM ('regular', 'general', 'nonmember');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "member_level" "MemberLevel" NOT NULL DEFAULT 'general';
