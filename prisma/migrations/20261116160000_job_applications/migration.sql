-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "upworkLeadId" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "jobUrl" TEXT NOT NULL DEFAULT 'N/A',
    "jobSource" TEXT NOT NULL DEFAULT 'other',
    "techStackJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "appliedAt" DATETIME,
    "notes" TEXT NOT NULL DEFAULT '',
    "skillFitScore" INTEGER,
    "skillFitJson" TEXT NOT NULL DEFAULT '{}',
    "skillFitAt" DATETIME,
    "atsScore" INTEGER,
    "atsAnalysisJson" TEXT NOT NULL DEFAULT '{}',
    "atsScoredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_upworkLeadId_fkey" FOREIGN KEY ("upworkLeadId") REFERENCES "UpworkJobLead" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);