import { test, expect } from "playwright-test-coverage";
import { Page } from "@playwright/test";
import { mockBackend } from "./mockBackend";

async function loginAsAdmin(page) {
  await mockBackend(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();
}

test("admin lists users", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole("main")).toContainText("Users");
  await expect(page.getByRole("main")).toContainText("Diner 1");
  await expect(page.getByRole("main")).toContainText("a@jwt.com");
});

test("admin paginates users", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole("main")).not.toContainText("Diner 12");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("main")).toContainText("Diner 12");
  await page.getByRole("button", { name: "Prev" }).click();
  await expect(page.getByRole("main")).toContainText("Diner 1");
});

test("admin filters users", async ({ page }) => {
  await loginAsAdmin(page);
  await page.getByPlaceholder("Filter users").fill("Diner 3");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("main")).toContainText("Diner 3");
  await expect(page.getByRole("main")).not.toContainText("Diner 4");
});

test("admin deletes a user", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole("main")).toContainText("Diner 2");
  await page
    .getByRole("row", { name: /Diner 2/ })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByRole("main")).not.toContainText("Diner 2");
});
