import { expect, test } from "./fixtures.ts";

test("live reload", async ({ page, liveServer }) => {
  const { tempDir, url } = await liveServer();

  await Deno.writeTextFile(
    `${tempDir}/index.html`,
    "<p id='test'>hello</p>",
  );

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

test("live reload markdown", async ({ page, liveServer }) => {
  const { tempDir, url } = await liveServer();

  await Deno.writeTextFile(
    `${tempDir}/README.md`,
    "# hello",
  );

  await page.goto(url + "/README.md");

  const webSocket = await page.waitForEvent("websocket");

  await expect(page.locator("h1")).toHaveText("hello");

  const waitForReloadEvent = webSocket.waitForEvent("framereceived", {
    predicate: (ev) => ev.payload === "reload",
  });

  await Promise.allSettled([
    await Deno.writeTextFile(
      `${tempDir}/README.md`,
      "# hey",
    ),
    waitForReloadEvent,
    page.waitForRequest(page.url()), // detect page reload
  ]);

  await expect(page.locator("h1")).toHaveText("hey");
});
