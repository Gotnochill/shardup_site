"use server";

import { Prisma, Role, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "../../../../auth";
import { parseQuestions, type CohortQuestion } from "../../../../lib/cohorts";
import { prisma } from "../../../../lib/prisma";

async function requireAdmin() {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== Role.ADMIN ||
    session.user.status !== UserStatus.ACTIVE
  ) {
    redirect("/dashboard");
  }
}

const yearSchema = z.coerce.number().int().min(2000).max(2100);

// Create the cohort for a year (or reactivate an existing one) and make it the
// single active cohort.
export async function setActiveCohort(formData: FormData) {
  await requireAdmin();

  const parsed = yearSchema.safeParse(formData.get("year"));
  if (!parsed.success) {
    redirect("/admin/cohort?error=invalid-year");
  }

  const year = parsed.data;
  const existing = await prisma.cohort.findUnique({ where: { year } });

  await prisma.$transaction([
    prisma.cohort.updateMany({ data: { isActive: false } }),
    existing
      ? prisma.cohort.update({ where: { id: existing.id }, data: { isActive: true } })
      : prisma.cohort.create({ data: { year, isActive: true } }),
  ]);

  revalidatePath("/admin/cohort");
  redirect("/admin/cohort");
}

const editSchema = z.object({
  action: z.enum(["add", "update", "remove", "up", "down"]),
  questionId: z.string().optional(),
  label: z.string().trim().max(300).optional(),
  required: z.string().optional(),
});

// Add / reword / remove / reorder the active cohort's questions. Question ids
// are stable so existing answers stay attached.
export async function editQuestion(formData: FormData) {
  await requireAdmin();

  const parsed = editSchema.safeParse({
    action: formData.get("action"),
    questionId: formData.get("questionId") ?? undefined,
    label: formData.get("label") ?? undefined,
    required: formData.get("required") ?? undefined,
  });
  if (!parsed.success) {
    redirect("/admin/cohort");
  }

  const cohort = await prisma.cohort.findFirst({ where: { isActive: true } });
  if (!cohort) {
    redirect("/admin/cohort");
  }

  const questions = parseQuestions(cohort.questions);
  const { action, questionId } = parsed.data;
  const label = parsed.data.label?.trim() ?? "";
  const required = parsed.data.required === "on";

  let next: CohortQuestion[] = questions;

  if (action === "add") {
    if (label) {
      next = [...questions, { id: crypto.randomUUID(), label, required }];
    }
  } else if (action === "update" && questionId) {
    next = questions.map((question) =>
      question.id === questionId
        ? { ...question, label: label || question.label, required }
        : question,
    );
  } else if (action === "remove" && questionId) {
    next = questions.filter((question) => question.id !== questionId);
  } else if ((action === "up" || action === "down") && questionId) {
    const index = questions.findIndex((question) => question.id === questionId);
    const target = action === "up" ? index - 1 : index + 1;
    if (index !== -1 && target >= 0 && target < questions.length) {
      next = [...questions];
      [next[index], next[target]] = [next[target], next[index]];
    }
  }

  await prisma.cohort.update({
    where: { id: cohort.id },
    data: { questions: next as unknown as Prisma.InputJsonValue },
  });

  revalidatePath("/admin/cohort");
  revalidatePath("/apply");
}
