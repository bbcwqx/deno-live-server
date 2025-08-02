import { test as base } from "@playwright/test";
import { TextLineStream } from "../vendor/jsr.io/@std/streams/1.0.10/text_line_stream.ts";

export interface LiveServerFixture {
  liveServer: () => Promise<{
    tempDir: string;
    process: Deno.ChildProcess;
  }>;
}

export const test = base.extend<LiveServerFixture>({
  liveServer: async ({ page: _ }, use) => {
    let process: Deno.ChildProcess | null = null;
    let tempDir: string | null = null;

    const liveServer = async () => {
      tempDir = await Deno.makeTempDir({ "prefix": "deno-live-server-" });

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

      process = command.spawn();

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

      return {
        tempDir,
        process,
      };
    };

    await use(liveServer);

    if (process) {
      process = process as Deno.ChildProcess;
      try {
        process.kill();
        await process.status;
      } catch {
        // Ignore
      }
    }

    if (tempDir) {
      try {
        await Deno.remove(tempDir, { recursive: true });
      } catch {
        // Ignore
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
