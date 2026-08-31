/*
  Warnings:

  - You are about to drop the column `area` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `priceUF` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Property` table. All the data in the column will be lost.
  - Added the required column `operation` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sector` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "area",
DROP COLUMN "location",
DROP COLUMN "priceUF",
DROP COLUMN "type",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "blueprints" TEXT[],
ADD COLUMN     "builtArea" DOUBLE PRECISION,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'UF',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "executive" TEXT,
ADD COLUMN     "isGreenProject" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTemporaryRent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "landArea" DOUBLE PRECISION,
ADD COLUMN     "latitude" TEXT,
ADD COLUMN     "longitude" TEXT,
ADD COLUMN     "operation" TEXT NOT NULL,
ADD COLUMN     "parking" INTEGER DEFAULT 0,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "publishedState" TEXT NOT NULL DEFAULT 'Publicado',
ADD COLUMN     "salesRoom" TEXT,
ADD COLUMN     "sector" TEXT NOT NULL,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "storage" INTEGER DEFAULT 0;
