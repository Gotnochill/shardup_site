import { Role, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { parseQuestions } from "../../../../lib/cohorts";
import { prisma } from "../../../../lib/prisma";
import { editQuestion, setActiveCohort } from "./actions";

export default async function CohortAdminPage({
  searchParams,
}: Readonly<{ searchParams?: { error?: string } }>) {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== Role.ADMIN ||
    session.user.status !== UserStatus.ACTIVE
  ) {
    redirect("/dashboard");
  }

  const cohort = await prisma.cohort.findFirst({ where: { isActive: true } });
  const questions = cohort ? parseQuestions(cohort.questions) : [];

  return (
    <main className="app-shell">
      <section className="app-card wide-card">
        <p className="section-label">Admin</p>
        <h1>Cohort</h1>
        {cohort ? (
          <p>
            Active cohort: <strong>Cohort {cohort.year}</strong>. Edit the questions
            applicants answer below.
          </p>
        ) : (
          <p>No active cohort yet. Set the year below to open applications.</p>
        )}

        {searchParams?.error === "invalid-year" ? (
          <p className="form-message error">Please enter a valid year (2000–2100).</p>
        ) : null}

        <div className="portal-section">
          <h2>{cohort ? "Change active year" : "Set active year"}</h2>
          <form action={setActiveCohort} className="stacked-form">
            <label>
              Year
              <input
                name="year"
                type="number"
                required
                min={2000}
                max={2100}
                defaultValue={cohort?.year}
                placeholder="e.g. 2027"
              />
            </label>
            <div className="form-row">
              <button className="button" type="submit">
                {cohort ? "Set active cohort" : "Open cohort"}
              </button>
            </div>
          </form>
        </div>

        {cohort ? (
          <div className="portal-section">
            <h2>Application questions</h2>
            {questions.length === 0 ? (
              <p className="muted-line">No questions yet. Add the first one below.</p>
            ) : (
              <div className="question-list">
                {questions.map((question, index) => (
                  <form action={editQuestion} className="question-row" key={question.id}>
                    <input type="hidden" name="questionId" value={question.id} />
                    <input name="label" defaultValue={question.label} aria-label="Question" />
                    <label className="inline-check">
                      <input
                        type="checkbox"
                        name="required"
                        defaultChecked={question.required}
                      />
                      Required
                    </label>
                    <div className="question-actions">
                      <button
                        className="icon-button"
                        name="action"
                        value="up"
                        type="submit"
                        disabled={index === 0}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        className="icon-button"
                        name="action"
                        value="down"
                        type="submit"
                        disabled={index === questions.length - 1}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button className="icon-button" name="action" value="update" type="submit">
                        Save
                      </button>
                      <button className="icon-button danger" name="action" value="remove" type="submit" aria-label="Remove">
                        ✕
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            )}

            <form action={editQuestion} className="question-row add-question">
              <input type="hidden" name="action" value="add" />
              <input name="label" placeholder="Add a new question" aria-label="New question" />
              <label className="inline-check">
                <input type="checkbox" name="required" />
                Required
              </label>
              <div className="question-actions">
                <button className="button" type="submit">
                  Add
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>
    </main>
  );
}
