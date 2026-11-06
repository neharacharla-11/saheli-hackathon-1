// Merges scripts/i18n-parts/{lang}-NN.json into src/lib/i18n/dicts/{lang}.json and lists missing keys.
// Run: node scripts/i18n-merge.mjs hi mr es ...
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const parts = path.join(root, "scripts/i18n-parts");
const strings = JSON.parse(fs.readFileSync(path.join(root, "scripts/strings.json"), "utf8"));

/** Name patterns, filled in by hand: "{}" is the name. */
const PATTERNS = {
  hi: { "Add {}": "{} जोड़ें", "Remove {}": "{} हटाएँ", "Remove date for {}": "{} की तारीख हटाएँ", "Chat with {}": "{} से बात करें", "Talk to {}…": "{} से बात करें…", "Message {}": "{} को मैसेज करें" },
  mr: { "Add {}": "{} जोडा", "Remove {}": "{} काढा", "Remove date for {}": "{} ची तारीख काढा", "Chat with {}": "{} शी गप्पा मारा", "Talk to {}…": "{} शी बोला…", "Message {}": "{} ला मेसेज करा" },
  es: { "Add {}": "Agregar {}", "Remove {}": "Quitar {}", "Remove date for {}": "Quitar la fecha de {}", "Chat with {}": "Chatear con {}", "Talk to {}…": "Habla con {}…", "Message {}": "Enviar mensaje a {}" },
  ru: { "Add {}": "Добавить {}", "Remove {}": "Удалить {}", "Remove date for {}": "Удалить дату: {}", "Chat with {}": "Чат с {}", "Talk to {}…": "Поговори с {}…", "Message {}": "Написать {}" },
  ko: { "Add {}": "{} 추가", "Remove {}": "{} 삭제", "Remove date for {}": "{} 날짜 삭제", "Chat with {}": "{}와 대화하기", "Talk to {}…": "{}에게 말해 보세요…", "Message {}": "{}에게 메시지 보내기" },
  zh: { "Add {}": "添加{}", "Remove {}": "移除{}", "Remove date for {}": "移除{}的日期", "Chat with {}": "和{}聊天", "Talk to {}…": "和{}说说…", "Message {}": "给{}发消息" },
};

/** Strings added after the big translation run, translated by hand. */
const EXTRA = {
  "Translations are a draft. Tell us if something reads oddly.": {
    hi: "अनुवाद अभी ड्राफ़्ट हैं। कुछ अजीब लगे तो हमें बताएँ।",
    mr: "भाषांतर अजून मसुदा आहे. काही विचित्र वाटलं तर आम्हाला सांगा.",
    es: "Las traducciones son un borrador. Avísanos si algo suena raro.",
    ru: "Переводы пока черновые. Скажи нам, если что-то звучит странно.",
    ko: "번역은 아직 초안이에요. 어색한 부분이 있으면 알려 주세요.",
    zh: "翻译还是草稿。如果有读起来奇怪的地方，请告诉我们。",
  },
};

/** The required words from the brief always win. */
const GLOSSARY = {
  hi: { Today: "आज", Cycle: "चक्र", Nourish: "पोषण", Move: "व्यायाम", Mind: "मन", "My stage": "मेरा पड़ाव", Health: "स्वास्थ्य", Care: "देखभाल", Circle: "सर्कल", Settings: "सेटिंग्स", "Get help": "मदद लें", Checklist: "चेकलिस्ट", "Health check": "हेल्थ चेक", "My reports": "मेरी रिपोर्ट", "Doctor summary": "डॉक्टर सारांश", "Pain diary": "दर्द डायरी", "Body Weather": "बॉडी वेदर", "Daily checklist": "रोज़ की चेकलिस्ट", Period: "पीरियड", Follicular: "फ़ॉलिक्युलर", Ovulation: "ओव्यूलेशन", Luteal: "ल्यूटियल", "Try with sample data": "सैंपल डेटा के साथ आज़माएँ", "Every app tracks her cycle.": "हर ऐप उसका चक्र ट्रैक करता है।", "None of them understand her.": "कोई भी उसे समझता नहीं।" },
  mr: { Today: "आज", Cycle: "चक्र", Nourish: "पोषण", Move: "हालचाल", Mind: "मन", "My stage": "माझा टप्पा", Health: "आरोग्य", Care: "काळजी", Circle: "सर्कल", Settings: "सेटिंग्ज", "Get help": "मदत घ्या", Checklist: "चेकलिस्ट", "Health check": "हेल्थ चेक", "My reports": "माझे रिपोर्ट", "Doctor summary": "डॉक्टर सारांश", "Pain diary": "वेदना डायरी", "Body Weather": "बॉडी वेदर", "Daily checklist": "रोजची चेकलिस्ट", Period: "पाळी", Follicular: "फॉलिक्युलर", Ovulation: "ओव्ह्युलेशन", Luteal: "ल्युटियल", "Try with sample data": "नमुना डेटासह वापरून पहा", "Every app tracks her cycle.": "प्रत्येक ॲप तिचे चक्र ट्रॅक करते.", "None of them understand her.": "पण कोणीच तिला समजून घेत नाही." },
  es: { Today: "Hoy", Cycle: "Ciclo", Nourish: "Nutrición", Move: "Movimiento", Mind: "Mente", "My stage": "Mi etapa", Health: "Salud", Care: "Cuidado", Circle: "Círculo", Settings: "Ajustes", "Get help": "Pedir ayuda", "Doctor summary": "Resumen para el médico", "Body Weather": "Clima corporal", Period: "Menstruación" },
};

const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();

for (const lang of process.argv.slice(2)) {
  const got = {};
  for (const f of fs.readdirSync(parts).filter((f) => f.startsWith(`${lang}-`) && f.endsWith(".json")).sort()) {
    try {
      const obj = JSON.parse(fs.readFileSync(path.join(parts, f), "utf8"));
      for (const [k, v] of Object.entries(obj)) if (typeof v === "string" && v.trim()) got[norm(k)] = v;
    } catch (e) {
      console.log(`${lang}: could not read ${f}: ${e.message}`);
    }
  }
  const out = {};
  const missing = [];
  for (const [k, t] of Object.entries(EXTRA)) if (t[lang]) got[norm(k)] = t[lang];
  for (const s of strings) {
    const v = got[norm(s)];
    if (v) out[s] = v;
    else missing.push(s);
  }
  for (const [k, v] of Object.entries(GLOSSARY[lang] ?? {})) if (k in out) out[k] = v;
  Object.assign(out, PATTERNS[lang] ?? {});
  fs.writeFileSync(path.join(root, `src/lib/i18n/dicts/${lang}.json`), JSON.stringify(out, null, 1) + "\n");
  fs.writeFileSync(path.join(parts, `missing-${lang}.json`), JSON.stringify(missing, null, 1));
  console.log(`${lang}: ${strings.length - missing.length}/${strings.length} translated, ${missing.length} missing`);
}
