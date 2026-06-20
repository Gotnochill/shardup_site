-- Baseline the existing auth and registration tables, then add events.
-- The IF NOT EXISTS guards make this migration safe for existing databases that
-- were previously initialized with prisma db push.

-- CreateEnum replacements for Prisma enums.
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "role" "Role" NOT NULL DEFAULT 'MEMBER',
  "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Account" (
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("provider", "providerAccountId")
);

CREATE TABLE IF NOT EXISTS "Session" (
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier", "token")
);

CREATE TABLE IF NOT EXISTS "Profile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT,
  "batch" TEXT,
  "branch" TEXT,
  "bio" TEXT,
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "githubUrl" TEXT,
  "linkedinUrl" TEXT,
  "leetcodeHandle" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Application" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "whyJoin" TEXT,
  "goals" TEXT,
  "experience" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EventRsvp" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Application_userId_key" ON "Application"("userId");
CREATE INDEX IF NOT EXISTS "Application_status_idx" ON "Application"("status");
CREATE INDEX IF NOT EXISTS "Event_published_startsAt_idx" ON "Event"("published", "startsAt");
CREATE INDEX IF NOT EXISTS "Event_createdById_idx" ON "Event"("createdById");
CREATE INDEX IF NOT EXISTS "EventRsvp_userId_idx" ON "EventRsvp"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "EventRsvp_eventId_userId_key" ON "EventRsvp"("eventId", "userId");

DO $$ BEGIN
  ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Application" ADD CONSTRAINT "Application_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
