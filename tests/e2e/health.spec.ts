import { expect, test } from "@playwright/test";

test.describe("health endpoint", () => {
  test("reports database connectivity and schema", async ({ request }) => {
    const response = await request.get("/api/health");
    const body = await response.json();

    expect(typeof body.ok).toBe("boolean");
    expect(body.checks.databaseUrl).toBe(true);
    expect(body.database).toBe(true);
    expect(body.schema).toBe(true);
  });
});
