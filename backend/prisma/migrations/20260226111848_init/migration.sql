-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('local', 'external');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('published', 'hidden', 'draft');

-- CreateTable
CREATE TABLE "videos" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "videoType" "VideoType" NOT NULL,
    "video_url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "duration" INTEGER,
    "category_id" INTEGER,
    "author_id" INTEGER NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "status" "VideoStatus" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "videos_category_id_idx" ON "videos"("category_id");

-- CreateIndex
CREATE INDEX "videos_author_id_idx" ON "videos"("author_id");

-- CreateIndex
CREATE INDEX "videos_videoType_idx" ON "videos"("videoType");

-- CreateIndex
CREATE INDEX "videos_status_idx" ON "videos"("status");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
