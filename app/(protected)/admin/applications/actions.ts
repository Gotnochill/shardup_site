"use server";

import { ApplicationStatus, Role, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

export async function reviewApplication(formData: FormData) {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== Role.ADMIN ||
    session.user.status !== UserStatus.ACTIVE
  ) {
    redirect("/dashboard");
  }

  const applicationId = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!applicationId || !["approve", "reject"].includes(decision)) {
    return;
  }

  const nextApplicationStatus =
    decision === "approve" ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED;
  const nextUserStatus = decision === "approve" ? UserStatus.ACTIVE : UserStatus.REJECTED;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { userId: true, status: true },
  });

  if (!application || application.status !== ApplicationStatus.SUBMITTED) {
    return;
  }

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: {
        status: nextApplicationStatus,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: application.userId },
      data: { status: nextUserStatus },
    }),
  ]);

  revalidatePath("/admin/applications");
}
