/*
  Warnings:

  - You are about to drop the column `externalConversionRate` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `externalCurrency` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `externalTaxPercentage` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `externalLink` on the `TripItem` table. All the data in the column will be lost.
  - You are about to drop the column `externalPrice` on the `TripItem` table. All the data in the column will be lost.
  - Added the required column `abroadConversionRate` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `abroadCurrency` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `abroadTaxPercentage` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `abroadPrice` to the `TripItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "abroadTaxPercentage" REAL NOT NULL,
    "abroadCurrency" TEXT NOT NULL,
    "abroadConversionRate" REAL NOT NULL,
    "localCurrency" TEXT NOT NULL,
    "ticketCost" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("createdAt", "id", "localCurrency", "name", "ticketCost", "updatedAt", "userId") SELECT "createdAt", "id", "localCurrency", "name", "ticketCost", "updatedAt", "userId" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
CREATE TABLE "new_TripItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "abroadPrice" REAL NOT NULL,
    "abroadLink" TEXT,
    "localPrice" REAL NOT NULL,
    "localLink" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tripId" TEXT NOT NULL,
    CONSTRAINT "TripItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TripItem" ("createdAt", "id", "localLink", "localPrice", "name", "quantity", "tripId", "updatedAt") SELECT "createdAt", "id", "localLink", "localPrice", "name", "quantity", "tripId", "updatedAt" FROM "TripItem";
DROP TABLE "TripItem";
ALTER TABLE "new_TripItem" RENAME TO "TripItem";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
