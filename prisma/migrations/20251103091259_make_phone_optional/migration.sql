-- AlterTable: Make phone optional for Google OAuth users
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;

-- Note: PostgreSQL allows multiple NULL values in UNIQUE columns, so this is safe
