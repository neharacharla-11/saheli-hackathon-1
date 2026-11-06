/// <reference lib="webworker" />
/**
 * Reads Apple Health's export.zip (or export.xml) off the main thread.
 * Messages in: { file: File, today: "YYYY-MM-DD" }
 * Messages out: { type: "progress", pct } | { type: "done", result } | { type: "error", message }
 */
import { finishApple, newAppleState, readAppleChunk } from "../lib/appleHealth";
import { findZipEntry, zipEntryText } from "../lib/zipEntry";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (e: MessageEvent<{ file: File; today: string }>) => {
  const { file, today } = e.data;
  try {
    let stream: ReadableStream<string>;
    let total = file.size;
    const isZip = /\.zip$/i.test(file.name) || file.type.includes("zip");
    if (isZip) {
      if (typeof DecompressionStream === "undefined") {
        ctx.postMessage({ type: "error", message: "This browser can't open zip files. Unzip export.zip and choose export.xml instead." });
        return;
      }
      const entry = await findZipEntry(file, (n) => /(^|\/)export\.xml$/i.test(n));
      if (!entry) {
        ctx.postMessage({ type: "error", message: "We couldn't find export.xml in that zip. Please choose the export.zip from the Health app." });
        return;
      }
      total = entry.compSize;
      stream = zipEntryText(file, entry);
    } else {
      stream = file.stream().pipeThrough(new TextDecoderStream() as unknown as ReadableWritablePair<string, Uint8Array>);
    }

    const st = newAppleState(today);
    let carry = "";
    let readChars = 0;
    let lastPct = -1;
    // Rough progress: XML text is ~10x the compressed size.
    const expectChars = isZip ? total * 10 : total;
    const reader = stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      carry = readAppleChunk(st, carry, value);
      readChars += value.length;
      const pct = Math.min(99, Math.round((readChars / expectChars) * 100));
      if (pct !== lastPct) {
        lastPct = pct;
        ctx.postMessage({ type: "progress", pct });
      }
    }
    readAppleChunk(st, carry, "\n");
    ctx.postMessage({ type: "done", result: finishApple(st) });
  } catch {
    ctx.postMessage({ type: "error", message: "We couldn't read that file. Please export it again from the Health app and try once more." });
  }
};
