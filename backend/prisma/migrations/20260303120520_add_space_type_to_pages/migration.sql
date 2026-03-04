-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('task', 'personal');

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "space_type" "SpaceType" NOT NULL DEFAULT 'personal';
