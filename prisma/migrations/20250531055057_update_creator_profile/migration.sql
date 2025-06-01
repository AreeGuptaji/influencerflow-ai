/*
  Warnings:

  - The values [CREATOR] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userId` on the `CreatorProfile` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('BRAND', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "CreatorProfile" DROP CONSTRAINT "CreatorProfile_userId_fkey";

-- DropIndex
DROP INDEX "CreatorProfile_userId_key";

-- AlterTable
ALTER TABLE "CreatorProfile" DROP COLUMN "userId",
ADD COLUMN     "contactInfo" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "recentContent" TEXT[],
ADD COLUMN     "username" TEXT;
