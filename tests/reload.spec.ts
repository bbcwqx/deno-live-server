import { expect, test } from "./fixtures.ts";

test("live reload", async ({ page, liveServer }) => {
  const { tempDir, url } = await liveServer();

  await page.goto(url);

  const webSocket = await page.waitForEvent("websocket");

  await expect(page.locator("#test")).toHaveText("hello");

  const waitForReloadEvent = webSocket.waitForEvent("framereceived", {
    predicate: (ev) => ev.payload === "reload",
  });

  await Promise.allSettled([
    Deno.writeTextFile(
      `${tempDir}/index.html`,
      "<p id='test'>hey</p>",
    ),
    waitForReloadEvent,
    page.waitForRequest(page.url()), // detect page reload
  ]);

  await expect(page.locator("#test")).toHaveText("hey");
});
