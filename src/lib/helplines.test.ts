import { describe, expect, it } from "vitest";
import { cleanPhone, helpFor, smsLink, sosMessage, whatsappLink } from "./helplines";

describe("helpFor", () => {
  it("gives India's numbers", () => {
    const h = helpFor("IN");
    expect(h.emergency.number).toBe("112");
    expect(h.others.map((o) => o.number)).toEqual(["181", "1091", "14416"]);
  });

  it("uses 911 in the US and 999 in the UK and 000 in Australia", () => {
    expect(helpFor("US").emergency.number).toBe("911");
    expect(helpFor("GB").emergency.number).toBe("999");
    expect(helpFor("AU").emergency.number).toBe("000");
  });

  it("falls back to 112 anywhere else", () => {
    expect(helpFor("FR").emergency.number).toBe("112");
    expect(helpFor(undefined).others).toEqual([]);
  });
});

describe("sosMessage", () => {
  it("includes the location only when added", () => {
    expect(sosMessage("Priya")).toBe("SOS: Priya needs help right now. Please call me. (sent from Saheli)");
    expect(sosMessage("Priya", "https://maps.google.com/?q=1,2")).toBe(
      "SOS: Priya needs help right now. Please call me. My location: https://maps.google.com/?q=1,2 (sent from Saheli)",
    );
  });
});

describe("links", () => {
  it("cleans phone numbers", () => {
    expect(cleanPhone("+91 98765-43210")).toBe("+919876543210");
  });

  it("builds WhatsApp and SMS links", () => {
    expect(whatsappLink("+91 98765 43210", "hi there")).toBe("https://wa.me/919876543210?text=hi%20there");
    expect(smsLink("+1 (555) 010-0000", "hi")).toBe("sms:+15550100000?&body=hi");
  });
});
