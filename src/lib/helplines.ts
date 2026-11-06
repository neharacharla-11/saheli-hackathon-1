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
  },
  {
    code: "AU",
    name: "Australia",
    dialCode: "+61",
    emergency: { label: "Emergency", number: "000" },
    others: [{ label: "1800RESPECT", number: "1800737732", display: "1800 737 732" }],
  },
];

export const OTHER_COUNTRY: CountryHelp = {
  code: "OTHER",
  name: "Somewhere else",
  dialCode: "+",
  emergency: { label: "Emergency", number: "112" },
  others: [],
};

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
