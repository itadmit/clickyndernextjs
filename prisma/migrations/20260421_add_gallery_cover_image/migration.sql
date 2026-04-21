-- AlterTable
ALTER TABLE "businesses" ADD COLUMN "cover_image_url" TEXT;

-- CreateTable
CREATE TABLE "business_gallery_images" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_gallery_images_business_id_idx" ON "business_gallery_images"("business_id");

-- AddForeignKey
ALTER TABLE "business_gallery_images" ADD CONSTRAINT "business_gallery_images_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
