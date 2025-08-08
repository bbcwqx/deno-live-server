import { test as base } from "@playwright/test";
import { TextLineStream } from "../vendor/jsr.io/@std/streams/1.0.10/text_line_stream.ts";

export interface LiveServerFixture {
  liveServer: () => Promise<{
    tempDir: string;
    url: string;
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
        "--port=0",
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

    let url: string | undefined;

    process.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream({ allowCR: true }))
      .pipeTo(
        new WritableStream({
          write: (line) => {
            if (line) {
              console.log(`[webserver] ${line}`);

              const match = line.match(/Local:\s+(http:\/\/\S+)/i);

              if (match) {
                url = match[1];
              }
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

    const start = Date.now();
    while (!url) {
      if (Date.now() - start > 5000) {
        throw new Error("Timed out waiting for server to start");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      await use(() => Promise.resolve({ tempDir, url: url! }));
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

export { expect } from "@playwright/test";
