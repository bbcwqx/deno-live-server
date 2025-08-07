import { test as base } from "@playwright/test";
import { TextLineStream } from "../vendor/jsr.io/@std/streams/1.0.10/text_line_stream.ts";

export interface LiveServerFixture {
  liveServer: () => Promise<{
    tempDir: string;
  }>;
}

export const test = base.extend<LiveServerFixture>({
  // deno-lint-ignore no-empty-pattern
  liveServer: async ({}, use) => {
    const tempDir = await Deno.makeTempDir({ "prefix": "deno-live-server-" });
    const abortController = new AbortController();

    await Deno.writeTextFile(
      `${tempDir}/index.html`,
      "<p id='test'>hello</p>",
    );

    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-read",
        "--allow-net",
        "./main.ts",
        tempDir,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const process = command.spawn();

    process.status.then((status) => {
      if (!status.success && !abortController.signal.aborted) {
        throw new Error(`Server exited with code ${status.code}`);
      }
    });

    process.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream({ allowCR: true }))
      .pipeTo(
        new WritableStream({
          write: (line) => {
            if (line) {
              console.log(`[webserver] ${line}`);
            }
          },
        }),
      );

    process.stderr
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream({ allowCR: true }))
      .pipeTo(
        new WritableStream({
          write: (line) => {
            if (line) {
              console.error(`[webserver] ${line}`);
            }
          },
        }),
      );

    await waitForServer();

    try {
      await use(() => Promise.resolve({ tempDir }));
    } finally {
      abortController.abort();
      try {
        await Deno.remove(tempDir, { recursive: true });
      } catch {
        // ignore
      }
    }
  },
});

export async function waitForServer(
  {
    port,
    hostname,
    timeout,
    interval,
  } = {
    port: 8080,
    hostname: "127.0.0.1",
    timeout: 5000,
    interval: 100,
  },
): Promise<void> {
  const start = Date.now();

  while (true) {
    try {
      const conn = await Deno.connect({ port, hostname });
      conn.close();
      return;
    } catch {
      if (Date.now() - start > timeout) {
        throw new Error(`Timed out waiting for ${hostname}:${port}`);
      }
      await new Promise((res) => setTimeout(res, interval));
    }
  }
}

export { expect } from "@playwright/test";
