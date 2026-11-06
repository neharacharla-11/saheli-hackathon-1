import Anthropic from "@anthropic-ai/sdk";
import { aiConfigured, CLAUDE_MODEL, claude, describeAiError, friendlyError, NOT_SWITCHED_ON, readJson } from "@/lib/server/claude";
import { cleanReport, REPORT_TOOL, REPORT_TOOL_NAME, reportSystemPrompt, type RawReport } from "@/lib/reportParse";

export const runtime = "nodejs";
// 30 s per try, one retry on 429 / 529.
export const maxDuration = 60;

const MAX_PDF_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_BYTES = 3.2 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

interface Body {
  kind?: unknown;
  mediaType?: unknown;
  data?: unknown;
}

/** Tells the app whether report reading is switched on. */
export function GET() {
  return Response.json({ ok: true, configured: aiConfigured() });
}

function base64Bytes(b64: string): number {
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

export async function POST(req: Request) {
  if (!aiConfigured()) return friendlyError(NOT_SWITCHED_ON, 503, { configured: false });

  const tooBig = Number(req.headers.get("content-length") ?? 0) > 4_400_000;
  const body = tooBig ? null : await readJson<Body>(req);
  if (!body) {
    return tooBig
      ? friendlyError("That file is too big. Please use a PDF under 3 MB or a photo.", 413)
      : friendlyError("That file didn't come through properly. Please try again.", 400);
  }

  const kind = body.kind;
  const data = typeof body.data === "string" ? body.data.replace(/^data:[^,]+,/, "").replace(/\s/g, "") : "";
  if ((kind !== "pdf" && kind !== "image") || !data) {
    return friendlyError("Please choose a PDF or a photo of your report.", 400);
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data.slice(0, 2000)) || data.length % 4 !== 0) {
    return friendlyError("That file didn't come through properly. Please try again.", 400);
  }
  const bytes = base64Bytes(data);

  let fileBlock: Anthropic.ContentBlockParam;
  if (kind === "pdf") {
    if (bytes > MAX_PDF_BYTES) return friendlyError("That PDF is over 3 MB. Please take a photo of each page instead.", 413);
    fileBlock = { type: "document", source: { type: "base64", media_type: "application/pdf", data } };
  } else {
    const mediaType = IMAGE_TYPES.includes(body.mediaType as ImageType) ? (body.mediaType as ImageType) : null;
    if (!mediaType) return friendlyError("Please use a JPEG, PNG or WebP photo.", 400);
    if (bytes > MAX_IMAGE_BYTES) return friendlyError("That photo is too big. Please try again.", 413);
    fileBlock = { type: "image", source: { type: "base64", media_type: mediaType, data } };
  }

  try {
    const msg = await claude().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      output_config: { effort: "low" },
      system: reportSystemPrompt(),
      // Sonnet 5.5 doesn't accept a forced tool_choice, so the prompt asks for the
      // tool, strict mode keeps the arguments valid, and we check it was called.
      tools: [REPORT_TOOL as unknown as Anthropic.Tool],
      tool_choice: { type: "auto", disable_parallel_tool_use: true },
      messages: [
        {
          role: "user",
          content: [fileBlock, { type: "text", text: `Read this report and call ${REPORT_TOOL_NAME} with every result.` }],
        },
      ],
    });

    if (msg.stop_reason === "refusal") {
      return friendlyError("Saheli couldn't read this file. You can type your numbers instead.", 422);
    }
    const call = msg.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === REPORT_TOOL_NAME);
    if (!call) {
      return friendlyError("Saheli couldn't find test results in that file. Try a clearer photo, or type your numbers.", 422);
    }
    const report = cleanReport(call.input as RawReport);
    if (!report.isLabReport || (report.values.length === 0 && report.other.length === 0)) {
      return friendlyError("This doesn't look like a lab report. Try a clearer photo, or type your numbers.", 422);
    }
    return Response.json({ ok: true, report });
  } catch (err) {
    const { message, status } = describeAiError(err);
    if (err instanceof Anthropic.BadRequestError && kind === "pdf") {
      return friendlyError("Saheli couldn't open that PDF. If it has a password, take a photo of each page instead.", 400);
    }
    return friendlyError(message, status);
  }
}
