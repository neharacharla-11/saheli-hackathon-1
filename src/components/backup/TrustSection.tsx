import { BookOpen, ExternalLink, FileLock2, Pill, UserCheck } from "lucide-react";

const SOURCES = [
  "World Health Organization (WHO)",
  "American College of Obstetricians and Gynecologists (ACOG)",
  "American Diabetes Association (ADA)",
  "ICMR nutrition guidelines for Indians",
  "The Menopause Society",
  "Endocrine Society",
];

/** "Why you can trust Saheli" on the Privacy page. */
export function TrustSection() {
  return (
    <section aria-labelledby="trust-title">
      <h2 id="trust-title" className="mb-4 font-display text-[1.6rem] leading-tight text-ink">
        Why you can trust Saheli
      </h2>
      <div className="grid gap-5 md:grid-cols-3">
        <article className="card">
          <BookOpen size={20} className="text-primary-ink" aria-hidden="true" />
          <h3 className="mt-3 font-semibold text-ink">Where the advice comes from</h3>
          <p className="mt-1 text-sm text-ink-soft">Saheli&apos;s guidance follows published guidelines from:</p>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {SOURCES.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-ink" aria-hidden="true" />
                {s}
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <UserCheck size={20} className="text-primary-ink" aria-hidden="true" />
          <h3 className="mt-3 font-semibold text-ink">Who writes and checks it</h3>
          <p className="mt-1 text-sm text-ink">
            Written by <span className="font-semibold">Neha Racharla</span>, Certified Nutritionist and Fitness Coach, specialised in women&apos;s nutrition.
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink">
            Doctor review
            <span className="inline-flex h-6 items-center rounded-full bg-[#FEF3C7] px-2.5 text-xs font-semibold text-[#92400E]">In progress</span>
          </p>
          <p className="mt-3 text-sm text-ink-soft">Saheli explains, it doesn&apos;t diagnose. Talk to your doctor.</p>
        </article>

        <article className="card">
          <FileLock2 size={20} className="text-primary-ink" aria-hidden="true" />
          <h3 className="mt-3 font-semibold text-ink">What happens to a report you upload</h3>
          <ul className="mt-2 space-y-2 text-sm text-ink">
            <li>It&apos;s saved only on this phone.</li>
            <li>When you tap to read it, it&apos;s sent securely to Claude, an AI by Anthropic, to pull out the numbers.</li>
            <li>It isn&apos;t stored on any server, and it isn&apos;t used to train AI.</li>
          </ul>
          <a
            href="https://www.anthropic.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-ink underline underline-offset-2"
          >
            Anthropic&apos;s privacy policy <ExternalLink size={14} aria-hidden="true" />
          </a>
        </article>
      </div>
      <p className="mt-5 flex items-start gap-2 rounded-2xl bg-surface-2 p-4 text-ink">
        <Pill size={18} className="mt-[3px] shrink-0 text-primary-ink" aria-hidden="true" />
        Saheli never tells you to start or stop a medicine. Always ask your doctor first.
      </p>
    </section>
  );
}
