import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL, TEST_EVENT_TITLE } from "./env";

// Applies migrations and seeds a deterministic, always-future event so the
// events suite has stable data regardless of the current date or DB contents.
export default async function globalSetup() {
  process.env.DATABASE_URL = DATABASE_URL;

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL },
  });

  const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

  try {
    // Recreate from scratch so RSVPs from a previous run are cleared (cascade).
    await prisma.event.deleteMany({ where: { title: TEST_EVENT_TITLE } });
    await prisma.event.create({
      data: {
        title: TEST_EVENT_TITLE,
        description: "Deterministic event used by the end-to-end suite.",
        location: "Online",
        startsAt: new Date("2999-01-01T17:30:00.000Z"),
        endsAt: new Date("2999-01-01T18:30:00.000Z"),
        published: true,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
