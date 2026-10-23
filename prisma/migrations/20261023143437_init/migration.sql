-- CreateTable
CREATE TABLE "Stop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "wheelchairAccessible" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Quay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "wheelchairAccessible" INTEGER NOT NULL,
    CONSTRAINT "Quay_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "Stop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
