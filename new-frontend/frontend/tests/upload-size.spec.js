import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";

test("rejects an oversized CSV and clears the upload form", async ({
  page,
}) => {
  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          accessToken: "playwright-test-token",
        },
      }),
    });
  });

  await page.route("**/api/datasets**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname === "/api/datasets") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "playwright-dataset",
            name: "playwright-dataset",
          },
        ]),
      });

      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "playwright-dataset",
        name: "playwright-dataset",
        totalRows: 1,
        mappings: [],
        updatedAt: "2026-09-17T00:00:00.000Z",
      }),
    });
  });

  await page.goto("/home");

  await page.getByRole("button", { name: /upload dataset/i }).click();

  const fileInput = page.getByLabel("Select CSV File");

  await fileInput.setInputFiles({
    name: "oversized-11mb.csv",
    mimeType: "text/csv",
    buffer: Buffer.alloc(11 * 1024 * 1024, "a"),
  });

  await expect(
    page.getByText("File is 11.0 MB; limit is 10 MB."),
  ).toBeVisible();

  await expect(fileInput).toHaveValue("");
  await expect(page.getByText(/Selected:/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Confirm" })).toBeDisabled();
});
