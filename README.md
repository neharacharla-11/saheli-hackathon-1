# Saheli

**Every app tracks her cycle. None of them understand her.**

Saheli ("female friend" in Hindi) is an AI companion that reads a woman's cycle and life stage and adapts her food, movement, mind and health care to how her body feels today.

**Live demo:** https://saheli-hackathon-win.vercel.app (tap "Try with sample data" to open one of 12 made-up women)

## The problem

Period apps count days. They don't connect a woman's cycle, symptoms, blood reports, food, mood and life stage, and they rarely tell her what to ask her doctor. Women with PCOS, thyroid problems, diabetes, pregnancy, a new baby or menopause end up juggling five apps, or none.

## Key features

- **Today and Body Weather:** a 10-second check-in, her phase, how energy, mood and cravings are likely to feel today, and a daily checklist.
- **Cycle:** period and symptom logging, predictions, phases and patterns.
- **Health check and AI report reader:** suggests tests to ask her doctor about from 90 days of logs; reads a blood report (PDF or photo), converts every value to one set of units, and explains each result with food and movement tips and trends.
- **Doctor summary:** one printable page with cycles, symptoms, patterns, suggested tests and results with previous values.
- **Nourish with Snap your plate:** phase-aware meals, a thali builder, Indian food first, and a meal photo that becomes foods and portions.
- **Move with guided workouts:** workouts that follow her phase and energy, at home or in the gym.
- **Mind and PMDD check:** mood check-ins, breathing, calm sounds, a journal with voice input, and a premenstrual check.
- **Every life stage:** regular cycle, first periods, PCOS, trying to conceive, pregnancy, postpartum with a baby tracker, and menopause.
- **Care with pain diary and endometriosis flag:** contraception, screenings, intimate health, and a pain diary that flags a pattern worth showing a doctor.
- **Circle:** share just her phase and simple tips with the people she chooses, never her logs or intimate details.
- **Bestie with a loved one's voice:** a streaming AI chat that knows her cycle day, mood, symptoms and latest results, and can read replies aloud.
- **7 languages:** English, Hindi, Marathi, Spanish, Russian, Korean and Chinese, plus voice input.
- **Offline:** a service worker keeps every page working without a connection.
- **Encrypted backup:** everything is encrypted on her phone before an optional cloud backup.

## How Claude is used

All Claude calls run server-side in Next.js API routes. The API key never reaches the browser.

- **Report reading:** a PDF (document block) or a photo (image block) goes to Claude with a strict tool. Claude returns each known test with its value, unit, test date, lab name and other results. Saheli converts the values to its own units, and she checks the numbers before saving.
- **Plate vision:** a meal photo becomes foods and portions matched to Saheli's food list, which she confirms.
- **Bestie chat:** streamed replies with her cycle day, phase, mood, symptoms and latest report values as context.

Every route checks its input, has a 30 second timeout, retries once when the API is busy, and returns kind errors.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, lucide-react, zustand (one store per profile, saved on the device), IndexedDB for report files and photos, the Anthropic SDK (`claude-sonnet-5-5`), Upstash Redis for small shared data, Web Crypto, a service worker, the Web Speech API, Vitest and Playwright. Deployed on Vercel.

## Privacy

- Her health data stays on her phone. There are no accounts.
- Cloud backup is optional and encrypted on the phone (PBKDF2 and AES-GCM). The server only stores data it can't read.
- The sample women are synthetic. No real personal or health data is used.
- Saheli explains, it never diagnoses or prescribes, and it always points her to her doctor.

## Run locally

```bash
cp .env.example .env.local   # add your ANTHROPIC_API_KEY; the other keys are optional
npm install
npm run dev                  # http://localhost:3000
```

Tests: `npm test`. Lint: `npm run lint`. Build: `npm run build`.

---

Built at the Code with Claude: Women in AI Hackathon, 6 Nov 2026, by Neha Racharla and Rakshita.
