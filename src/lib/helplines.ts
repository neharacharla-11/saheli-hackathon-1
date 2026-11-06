export interface Helpline {
  label: string;
  number: string; // what she dials
  display?: string; // how it's written
  note?: string;
}

export interface CountryHelp {
  code: string;
  name: string;
  dialCode: string;
  emergency: Helpline;
  others: Helpline[];
  /** Mental health and crisis lines, for Mind, mood checks and Circle. */
  mental?: Helpline[];
  /** A short line shown under the numbers. */
  note?: string;
}

export const COUNTRIES: CountryHelp[] = [
  {
    code: "IN",
    name: "India",
    dialCode: "+91",
    emergency: { label: "Emergency", number: "112" },
    others: [
      { label: "Women Helpline", number: "181" },
      { label: "Women Police", number: "1091" },
      { label: "Tele MANAS (mental health)", number: "14416" },
    ],
    mental: [
      { label: "Tele MANAS (mental health)", number: "14416", note: "Free, 24 hours, many Indian languages" },
      { label: "KIRAN mental health helpline", number: "18005990019", display: "1800-599-0019" },
      { label: "Vandrevala Foundation", number: "+919999666555", display: "+91 99996 66555", note: "Call or WhatsApp, 24 hours" },
    ],
  },
  {
    code: "US",
    name: "United States",
    dialCode: "+1",
    emergency: { label: "Emergency", number: "911" },
    others: [
      { label: "Domestic Violence Hotline", number: "18007997233", display: "1-800-799-7233" },
      { label: "Suicide and Crisis Lifeline", number: "988" },
    ],
    mental: [
      { label: "988 Suicide and Crisis Lifeline", number: "988", note: "Call or text, 24 hours" },
      { label: "Maternal Mental Health Hotline", number: "18338526262", display: "1-833-852-6262" },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    emergency: { label: "Emergency", number: "999" },
    others: [
      { label: "Domestic Abuse Helpline", number: "08082000247", display: "0808 2000 247" },
      { label: "Samaritans", number: "116123", display: "116 123" },
    ],
    mental: [
      { label: "Samaritans", number: "116123", display: "116 123", note: "Free, 24 hours" },
      { label: "NHS 111 (option 2, mental health)", number: "111" },
      { label: "Shout (text SHOUT)", number: "85258", display: "Text 85258" },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    dialCode: "+61",
    emergency: { label: "Emergency", number: "000" },
    others: [{ label: "1800RESPECT", number: "1800737732", display: "1800 737 732" }],
    mental: [
      { label: "Lifeline", number: "131114", display: "13 11 14" },
      { label: "PANDA (perinatal)", number: "1300726306", display: "1300 726 306" },
    ],
  },
];

export const OTHER_COUNTRY: CountryHelp = {
  code: "OTHER",
  name: "International",
  dialCode: "+",
  emergency: { label: "Emergency", number: "112", note: "Works on most mobile phones worldwide" },
  others: [],
  mental: [],
  note: "Find a free helpline in your country at findahelpline.com.",
};

/** Every option in a country picker: India, US, UK, Australia, then International. */
export const HELP_COUNTRIES: CountryHelp[] = [...COUNTRIES, OTHER_COUNTRY];

/** Emergency, then other lines, then mental health lines, without repeats. */
export function allHelplines(country: string | undefined): Helpline[] {
  const h = helpFor(country);
  const all = [h.emergency, ...h.others, ...(h.mental ?? [])];
  return all.filter((l, i) => all.findIndex((x) => x.number === l.number) === i);
}

/** Mental health lines for her country, with emergency as the fallback. */
export function mentalHealthLines(country: string | undefined): Helpline[] {
  const h = helpFor(country);
  return h.mental?.length ? h.mental : [h.emergency];
}

export function helpFor(country: string | undefined): CountryHelp {
  return COUNTRIES.find((c) => c.code === country) ?? OTHER_COUNTRY;
}

/** The SOS text. Location is only included if she added it just now. */
export function sosMessage(name: string, locationUrl?: string): string {
  const who = name.trim() || "I";
  const first = who === "I" ? "SOS: I need help right now." : `SOS: ${who} needs help right now.`;
  const loc = locationUrl ? ` My location: ${locationUrl}` : "";
  return `${first} Please call me.${loc} (sent from Saheli)`;
}

/** Keep a leading + and digits only. */
export function cleanPhone(phone: string): string {
  const t = phone.trim();
  const digits = t.replace(/\D/g, "");
  return t.startsWith("+") ? `+${digits}` : digits;
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${cleanPhone(phone).replace(/^\+/, "")}?text=${encodeURIComponent(text)}`;
}

export function smsLink(phone: string, text: string): string {
  return `sms:${cleanPhone(phone)}?&body=${encodeURIComponent(text)}`;
}

export function telLink(phone: string): string {
  return `tel:${cleanPhone(phone)}`;
}

export function mapsLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
}
