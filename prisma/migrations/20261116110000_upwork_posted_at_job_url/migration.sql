-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UpworkJobLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "jobUrl" TEXT NOT NULL DEFAULT 'N/A',
    "postedAtText" TEXT NOT NULL DEFAULT '',
    "postedAt" DATETIME,
    "description" TEXT NOT NULL DEFAULT '',
    "techStackJson" TEXT NOT NULL DEFAULT '[]',
    "connectsRequired" INTEGER,
    "hourlyRateText" TEXT NOT NULL DEFAULT '',
    "durationText" TEXT NOT NULL DEFAULT '',
    "experienceLevel" TEXT NOT NULL DEFAULT '',
    "projectType" TEXT NOT NULL DEFAULT '',
    "clientName" TEXT NOT NULL DEFAULT '',
    "clientInfoJson" TEXT NOT NULL DEFAULT '{}',
    "activityJson" TEXT NOT NULL DEFAULT '{}',
    "engagementScore" INTEGER,
    "genuinenessScore" INTEGER,
    "aiAnalysisJson" TEXT NOT NULL DEFAULT '{}',
    "analyzedAt" DATETIME,
    "atsScore" INTEGER,
    "atsAnalysisJson" TEXT NOT NULL DEFAULT '{}',
    "atsScoredAt" DATETIME,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'interested',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UpworkJobLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UpworkJobLead" (
    "id", "userId", "title", "jobUrl", "postedAtText", "postedAt", "description", "techStackJson",
    "connectsRequired", "hourlyRateText", "durationText", "experienceLevel", "projectType",
    "clientName", "clientInfoJson", "activityJson", "engagementScore", "genuinenessScore",
    "aiAnalysisJson", "analyzedAt", "atsScore", "atsAnalysisJson", "atsScoredAt", "notes", "status",
    "createdAt", "updatedAt"
) SELECT
    "id", "userId", "title",
    CASE WHEN trim("jobUrl") = '' THEN 'N/A' ELSE "jobUrl" END,
    "postedAtText", NULL, "description", "techStackJson",
    "connectsRequired", "hourlyRateText", "durationText", "experienceLevel", "projectType",
    "clientName", "clientInfoJson", "activityJson", "engagementScore", "genuinenessScore",
    "aiAnalysisJson", "analyzedAt", "atsScore", "atsAnalysisJson", "atsScoredAt", "notes", "status",
    "createdAt", "updatedAt"
FROM "UpworkJobLead";
DROP TABLE "UpworkJobLead";
ALTER TABLE "new_UpworkJobLead" RENAME TO "UpworkJobLead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;