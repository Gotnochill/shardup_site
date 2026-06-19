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

  // User gaya but session zinda → access null aata hai. Ruk jao, warna FK error.
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

  if (!application && access?.role !== Role.ADMIN) {
    await prisma.application.create({
      data: { userId, status: ApplicationStatus.DRAFT },
    });
  }
}
