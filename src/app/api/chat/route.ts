import Anthropic from "@anthropic-ai/sdk";
import { aiConfigured, claude, CLAUDE_MODEL, describeAiError, friendlyError, NOT_SWITCHED_ON, readJson } from "@/lib/server/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Lets the UI show a kind "not switched on yet" message instead of failing. */
export async function GET() {
  return Response.json({ configured: aiConfigured() });
}

interface ChatBody {
  messages?: { role?: string; text?: string }[];
  context?: Record<string, unknown>;
}

const MAX_MESSAGES = 24;
const MAX_CHARS = 4000;

function str(v: unknown, max = 200): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
}

function systemPrompt(ctx: Record<string, unknown>): string {
  const companion = str(ctx.companionName, 40) ?? "Bestie";
  const name = str(ctx.name, 40) ?? "her";
  const facts: string[] = [];
  const add = (label: string, v: unknown, max = 200) => {
    const s = typeof v === "number" ? String(v) : str(v, max);
    if (s) facts.push(`- ${label}: ${s}`);
  };
  add("Her name", ctx.name, 40);
  add("Age", ctx.age);
  add("Country", ctx.country, 40);
  add("Life stage", ctx.stage, 60);
  add("Cycle day", ctx.cycleDay);
  add("Phase", ctx.phase, 40);
  add("Next period expected", ctx.nextPeriod, 40);
  add("Weeks pregnant", ctx.pregnancyWeek);
  add("Baby's age", ctx.babyAge, 40);
  add("Mood today", ctx.mood, 40);
  add("Energy today (1-5)", ctx.energy);
  add("Stress today (1-5)", ctx.stress);
  if (Array.isArray(ctx.symptoms) && ctx.symptoms.length) {
    add("Symptoms today", ctx.symptoms.filter((s) => typeof s === "string").slice(0, 12).join(", "), 300);
  }
  if (Array.isArray(ctx.reports) && ctx.reports.length) {
    add("Latest report values", ctx.reports.filter((s) => typeof s === "string").slice(0, 12).join("; "), 600);
  }
  add("Diet", ctx.diet, 40);
  add("Today's food so far", ctx.foodToday, 120);
  add("Helplines for her country", ctx.helplines, 300);
  const young = ctx.stage === "first-period" || (typeof ctx.age === "number" && ctx.age < 16);

  return `You are ${companion}, a warm, caring companion inside Saheli, a women's wellness app. You talk with ${name} like a kind, knowledgeable older sister or best friend who knows women's health, nutrition and movement well. Saheli was made by Neha Racharla, a certified nutritionist and fitness coach who specialises in women's nutrition.

What you know about her today (from her own logs on her phone):
${facts.length ? facts.join("\n") : "- Nothing logged yet."}

How to reply:
- Keep it short, like a text from a friend: 2-4 short sentences in one or two small paragraphs, about 70 words at most. Only go longer (a few short bullets) when she asks for a list, recipe or plan, or for a red flag. Plain, kind words. Second person ("you").
- Use what you know (her cycle day, phase, mood, symptoms, reports) naturally when it helps, and explain how her phase may be affecting how she feels.
- Indian food and culture are first-class: suggest everyday Indian foods first (dal, roti, ragi, poha, sabzi, curd) and global options too. Respect her diet.
- No emoji and no exclamation marks.
- Never diagnose, never prescribe medicines or doses, and never claim certainty about a medical cause. You can explain what might be going on and what usually helps, then suggest talking to her doctor.
- Never suggest eating below her body's basic needs, crash diets, fasting for weight loss or anything that could feed an eating problem. Never comment on her body or weight unless she asks, and stay gentle.${young ? "\n- She is young. Keep it simple and gentle, no calories, weight or diet talk, and encourage her to talk to a parent, school nurse or trusted adult." : ""}
- Red flags: if she mentions very heavy bleeding (soaking a pad an hour), fainting, severe or sudden pain, fever with pelvic pain, chest pain, trouble breathing, bleeding or fluid leaking or reduced baby movements in pregnancy, very high or very low blood sugar, or a baby who is unwell or has few wet nappies, clearly tell her to call her doctor now or go to the emergency department.
- If she mentions thoughts of self-harm or suicide, or that she is not safe at home: respond with warmth, tell her she is not alone, ask her to reach out right now to someone she trusts and to a helpline (use the helplines for her country above, or her local emergency number), and remind her the "Get help" button in Saheli is always there.
- If she asks something outside health and everyday life, you can chat kindly, but keep it brief.`;
}

export async function POST(req: Request) {
  if (!aiConfigured()) return friendlyError(NOT_SWITCHED_ON, 503, { configured: false });

  const body = await readJson<ChatBody>(req, 200_000);
  if (!body || !Array.isArray(body.messages)) return friendlyError("Please send a message.", 400);

  const messages: Anthropic.MessageParam[] = [];
  for (const m of body.messages.slice(-MAX_MESSAGES)) {
    const text = typeof m?.text === "string" ? m.text.trim().slice(0, MAX_CHARS) : "";
    const role = m?.role === "assistant" ? "assistant" : m?.role === "user" ? "user" : null;
    if (!text || !role) continue;
    messages.push({ role, content: text });
  }
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return friendlyError("Please send a message.", 400);
  }

  const ctx = body.context && typeof body.context === "object" ? body.context : {};

  try {
    const stream = claude().beta.messages.stream(
      {
        model: CLAUDE_MODEL,
        max_tokens: 1200,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system: systemPrompt(ctx),
        messages,
      },
      { signal: req.signal },
    );

    // Wait for the first event so connection or key errors become a friendly JSON error.
    const iterator = stream[Symbol.asyncIterator]();
    const first = await iterator.next();

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (ev: IteratorResult<Anthropic.Beta.Messages.BetaRawMessageStreamEvent>) => {
          if (ev.done) return;
          const e = ev.value;
          if (e.type === "content_block_delta" && e.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(e.delta.text));
          }
        };
        try {
          send(first);
          for (;;) {
            const ev = await iterator.next();
            if (ev.done) break;
            send(ev);
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") {
            controller.enqueue(
              encoder.encode("\n\nI can't help with that one, but I'm here for anything else. If something feels urgent, please talk to your doctor."),
            );
          }
        } catch {
          controller.enqueue(encoder.encode("\n\n(Sorry, I lost my words for a moment. Please try again.)"));
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(body, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
    });
  } catch (err) {
    const { message, status } = describeAiError(err);
    return friendlyError(message, status);
  }
}
