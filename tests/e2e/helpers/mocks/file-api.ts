import { Page } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

type FileApiMockOptions = {
  mockFileKey: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  fileUrl?: string;
};

export async function mockFileApi(
  page: Page,
  {
    mockFileKey,
    originalName = "sample.csv",
    mimeType = "text/csv",
    fileSize = 20,
    fileUrl = "http://example.com/sample.csv",
  }: FileApiMockOptions
) {
  let uploadCounter = 0;
  await page.route("**/api/files**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const fileKey = url.pathname.split("/").pop() || mockFileKey;

    if (method === "POST" && url.pathname.endsWith("/api/files")) {
      uploadCounter += 1;
      const generatedKey = `${mockFileKey}-${uploadCounter}-${uuidv4()}`;
      await page.request.post("http://localhost:3000/api/test/files", {
        data: {
          key: generatedKey,
          mimeType,
          originalName,
          fileSize,
        },
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          key: generatedKey,
          mimeType,
          originalName,
          id: 1,
          fileSize,
        }),
      });
      return;
    }

    if (method === "GET" && url.searchParams.get("getLink") === "true") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: fileUrl }),
      });
      return;
    }

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          key: fileKey,
          mimeType,
          originalName,
          id: 1,
          fileSize,
        }),
      });
      return;
    }

    if (method === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
      return;
    }

    await route.fallback();
  });
}
