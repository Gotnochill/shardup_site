import { expect, test } from "@playwright/test";
import { TEST_EVENT_TITLE } from "./env";
import { devLogin } from "./utils";

test.describe("events", () => {
  test("lists the seeded event and prompts anonymous users to sign in", async ({ page }) => {
    await page.goto("/events");

    const card = page.locator(".event-card", { hasText: TEST_EVENT_TITLE });
    await expect(card).toBeVisible();

    const rsvp = card.getByRole("link", { name: "Sign in to RSVP" });
    await expect(rsvp).toHaveAttribute("href", "/join");
  });

  test("lets an active admin RSVP and cancel", async ({ page }) => {
    await devLogin(page, "admin");
    await page.goto("/events");

    const card = page.locator(".event-card", { hasText: TEST_EVENT_TITLE });
    await expect(card).toBeVisible();
    await expect(card).toContainText("0 going");

    await card.getByRole("button", { name: "RSVP", exact: true }).click();
    await expect(card.getByRole("button", { name: "Cancel RSVP" })).toBeVisible();
    await expect(card).toContainText("1 going");

    await card.getByRole("button", { name: "Cancel RSVP" }).click();
    await expect(card.getByRole("button", { name: "RSVP", exact: true })).toBeVisible();
    await expect(card).toContainText("0 going");
  });

  test("returns 404 for an unknown event", async ({ page }) => {
    const response = await page.goto("/events/this-event-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("renders the detail page with a sign-in prompt for anonymous users", async ({ page }) => {
    await page.goto("/events");
    const card = page.locator(".event-card", { hasText: TEST_EVENT_TITLE });
    await card.getByRole("link", { name: "Details" }).click();

    await expect(page.getByRole("heading", { name: TEST_EVENT_TITLE })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in to RSVP" })).toHaveAttribute(
      "href",
      "/join",
    );
  });
});
