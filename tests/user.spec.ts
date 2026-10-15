import { test, expect } from "playwright-test-coverage";
import { Page } from "@playwright/test";
import { mockBackend } from "./mockBackend";

test("updateUser", async ({ page }) => {
  await mockBackend(page);
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("pizza diner");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Register" }).click();

  await page.getByRole("link", { name: "pd" }).click();
  await expect(page.getByRole("main")).toContainText("pizza diner");

  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
  await page.getByRole("button", { name: "Update" }).click();
  await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });
  await expect(page.getByRole("main")).toContainText("pizza diner");
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
  await page.getByRole("textbox").first().fill("pizza dinerx");
  await page.getByRole("button", { name: "Update" }).click();
  await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });
  await expect(page.getByRole("main")).toContainText("pizza dinerx");

  //Login Tests
  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();

  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza dinerx");
});

test("updateUser email", async ({ page }) => {
  await mockBackend(page);
  const email = await registerDiner(page);
  const newEmail = `new${email}`;

  await openEditDialog(page);
  await page.getByRole("dialog").getByRole("textbox").nth(1).fill(newEmail);
  await submitEdit(page);
  await expect(page.getByRole("main")).toContainText(newEmail);

  await logoutAndLogin(page, newEmail, "diner");
  await page.getByRole("link", { name: "pd" }).click();
  await expect(page.getByRole("main")).toContainText(newEmail);
});

test("updateUser password", async ({ page }) => {
  await mockBackend(page);
  const email = await registerDiner(page);

  await openEditDialog(page);
  await page.getByRole("dialog").getByRole("textbox").nth(2).fill("newpass");
  await submitEdit(page);

  await logoutAndLogin(page, email, "newpass");
  await page.getByRole("link", { name: "pd" }).click();
  await expect(page.getByRole("main")).toContainText("pizza diner");
});

test("updateUser as admin", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("link", { name: "AU" }).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox")
    .first()
    .fill("Admin Userx");
  await submitEdit(page);
  await expect(page.getByRole("main")).toContainText("Admin Userx");
  await expect(page.getByRole("main")).toContainText("admin");
});

async function registerDiner(page: Page, name = "pizza diner") {
  const email = `user${Math.floor(Math.random() * 100000)}@jwt.com`;
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill(name);
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Register" }).click();
  return email;
}

async function logoutAndLogin(page: Page, email: string, password: string) {
  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Login" }).click();
}

async function openEditDialog(page: Page) {
  await page.getByRole("link", { name: "pd" }).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
}

async function submitEdit(page: Page) {
  await page.getByRole("button", { name: "Update" }).click();
  await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });
}
