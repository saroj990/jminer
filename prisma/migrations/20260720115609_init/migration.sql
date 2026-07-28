-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "aiMode" TEXT NOT NULL DEFAULT 'online',
    CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL DEFAULT '',
    "headline" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "github" TEXT NOT NULL DEFAULT '',
    "linkedin" TEXT NOT NULL DEFAULT '',
    "portfolio" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "employmentType" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "startDate" TEXT NOT NULL DEFAULT '',
    "endDate" TEXT NOT NULL DEFAULT '',
    "current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL DEFAULT '',
    "achievements" TEXT NOT NULL DEFAULT '',
    "technologies" TEXT NOT NULL DEFAULT '',
    "skills" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Experience_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "institution" TEXT NOT NULL DEFAULT '',
    "degree" TEXT NOT NULL DEFAULT '',
    "field" TEXT NOT NULL DEFAULT '',
    "grade" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "startDate" TEXT NOT NULL DEFAULT '',
    "endDate" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "achievements" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "githubUrl" TEXT NOT NULL DEFAULT '',
    "liveUrl" TEXT NOT NULL DEFAULT '',
    "technologies" TEXT NOT NULL DEFAULT '',
    "duration" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "impact" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Skill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "organization" TEXT NOT NULL DEFAULT '',
    "credentialId" TEXT NOT NULL DEFAULT '',
    "issueDate" TEXT NOT NULL DEFAULT '',
    "expiryDate" TEXT NOT NULL DEFAULT '',
    "verificationUrl" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Certification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "organization" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Award_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "publisher" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Publication_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "proficiency" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Language_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Interest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'classic',
    "accentColor" TEXT NOT NULL DEFAULT '#1f7a6c',
    "fontFamily" TEXT NOT NULL DEFAULT 'helvetica',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "pageSize" TEXT NOT NULL DEFAULT 'letter',
    "config" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resumeId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "template" TEXT NOT NULL DEFAULT 'classic',
    "exportType" TEXT NOT NULL DEFAULT '',
    "snapshot" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResumeVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
