import { ApplicationStatus, Role, UserStatus } from "@prisma/client";
import { prisma } from "./prisma";

function getAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function syncUserAccess(userId: string, email?: string | null) {
  const adminEmails = getAdminEmails();
  const normalizedEmail = email?.trim().toLowerCase();
  const localDevEmail = process.env.LOCAL_DEV_AUTH_EMAIL?.trim().toLowerCase();
  const isConfiguredLocalDevUser =
    process.env.NODE_ENV === "development" &&
    process.env.LOCAL_DEV_AUTH_ENABLED === "true" &&
    Boolean(normalizedEmail && localDevEmail && normalizedEmail === localDevEmail);
  const shouldBeAdmin = Boolean(normalizedEmail && adminEmails.has(normalizedEmail));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });

  if (!user) {
    return null;
  }

  if (shouldBeAdmin && (user.role !== Role.ADMIN || user.status !== UserStatus.ACTIVE)) {
    return prisma.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN, status: UserStatus.ACTIVE },
      select: { id: true, role: true, status: true },
    });
  }

  if (!isConfiguredLocalDevUser && adminEmails.size > 0 && user.role === Role.ADMIN && !shouldBeAdmin) {
    return prisma.user.update({
      where: { id: userId },
      data: { role: Role.MEMBER },
      select: { id: true, role: true, status: true },
    });
  }

  return { id: userId, role: user.role, status: user.status };
}

export async function ensureRegistrationRecords(userId: string, email?: string | null) {
  const access = await syncUserAccess(userId, email);

  // syncUserAccess returns null when the user row no longer exists (e.g. a
  // session that outlived its user). Bail out instead of creating child rows
  // for a missing user, which would violate the foreign key.
  if (!access) {
    return;
  }

  await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const application = await prisma.application.findUnique({
    where: { userId },
  });

  if (!application && access.role !== Role.ADMIN) {
    // Open a blank draft for the current active cohort (if there is one).
    const activeCohort = await prisma.cohort.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    await prisma.application.create({
      data: {
        userId,
        status: ApplicationStatus.DRAFT,
        cohortId: activeCohort?.id ?? null,
      },
    });
  }
}
