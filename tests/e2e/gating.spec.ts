import { expect, test } from "@playwright/test";
import { devLogin } from "./utils";

test.describe("route gating", () => {
  test("redirects anonymous users from /dashboard to /join", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/join");
    await expect(page).toHaveURL(/\/join$/);
  });

  test("redirects anonymous users from /admin/applications to /join", async ({ page }) => {
    await page.goto("/admin/applications");
    await page.waitForURL("**/join");
    await expect(page).toHaveURL(/\/join$/);
  });

  test("keeps a pending member out of the admin area", async ({ page }) => {
    await devLogin(page, "member");
    // Admin page redirects non-admins to /dashboard, which redirects a pending
    // member on to /apply.
    await page.goto("/admin/applications");
    await page.waitForURL("**/apply");
    await expect(page).toHaveURL(/\/apply$/);
  });

  test("lets an admin reach the application review page", async ({ page }) => {
    await devLogin(page, "admin");
    await page.goto("/admin/applications");
    await expect(page.getByRole("heading", { name: "Application review" })).toBeVisible();
  });
});
