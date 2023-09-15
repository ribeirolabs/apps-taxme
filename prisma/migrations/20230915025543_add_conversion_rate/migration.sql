/*
  Warnings:

  - Added the required column `externalConversionRate` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "externalTaxPercentage" REAL NOT NULL,
    "externalCurrency" TEXT NOT NULL,
    "externalConversionRate" REAL NOT NULL,
    "localCurrency" TEXT NOT NULL,
    "ticketCost" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("createdAt", "externalCurrency", "externalTaxPercentage", "id", "localCurrency", "name", "ticketCost", "updatedAt", "userId") SELECT "createdAt", "externalCurrency", "externalTaxPercentage", "id", "localCurrency", "name", "ticketCost", "updatedAt", "userId" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
