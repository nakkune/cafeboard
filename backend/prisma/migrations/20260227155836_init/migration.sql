-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "workspace_join_requests" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "workspace_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_join_requests_workspace_id_user_id_key" ON "workspace_join_requests"("workspace_id", "user_id");

-- AddForeignKey
ALTER TABLE "workspace_join_requests" ADD CONSTRAINT "workspace_join_requests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_join_requests" ADD CONSTRAINT "workspace_join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
