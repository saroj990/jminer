-- CreateTable
CREATE TABLE "TrackedCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "websiteUrl" TEXT NOT NULL DEFAULT 'N/A',
    "careersUrl" TEXT NOT NULL DEFAULT '',
    "careersUrlSource" TEXT NOT NULL DEFAULT '',
    "fetchIntervalMinutes" INTEGER NOT NULL DEFAULT 1440,
    "lastFetchedAt" DATETIME,
    "lastFetchStatus" TEXT NOT NULL DEFAULT '',
    "lastFetchError" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrackedCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CompanyJobListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "jobUrl" TEXT NOT NULL DEFAULT 'N/A',
    "locationText" TEXT NOT NULL DEFAULT '',
    "descriptionSnippet" TEXT NOT NULL DEFAULT '',
    "techStackJson" TEXT NOT NULL DEFAULT '[]',
    "externalKey" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "skillFitScore" INTEGER,
    "skillFitJson" TEXT NOT NULL DEFAULT '{}',
    "skillFitAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyJobListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyJobListing_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "TrackedCompany" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CompanyJobListing_companyId_externalKey_key" ON "CompanyJobListing"("companyId", "externalKey");