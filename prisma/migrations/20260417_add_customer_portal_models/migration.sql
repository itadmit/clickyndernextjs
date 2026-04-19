-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "user_id" TEXT;

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_invites" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_codes_phone_code_idx" ON "otp_codes"("phone", "code");

-- CreateIndex
CREATE UNIQUE INDEX "business_invites_token_key" ON "business_invites"("token");

-- CreateIndex
CREATE INDEX "business_invites_business_id_idx" ON "business_invites"("business_id");

-- CreateIndex
CREATE INDEX "customer_notifications_user_id_acknowledged_idx" ON "customer_notifications"("user_id", "acknowledged");

-- CreateIndex
CREATE INDEX "customer_notifications_business_id_idx" ON "customer_notifications"("business_id");

-- CreateIndex
CREATE INDEX "customers_user_id_idx" ON "customers"("user_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_invites" ADD CONSTRAINT "business_invites_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
