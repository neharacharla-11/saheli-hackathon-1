import { describe, expect, it } from "vitest";
import { activeTab, NAV, navItemFor } from "./nav";

describe("navigation", () => {
  it("has the 11 menu items", () => {
    expect(NAV).toHaveLength(11);
  });

  it("maps grouped pages to their menu item and tab", () => {
    expect(navItemFor("/app/checklist")?.key).toBe("today");
    expect(navItemFor("/app/pain")?.key).toBe("care");
    expect(navItemFor("/app/care")?.key).toBe("care");
    expect(activeTab("/app/care")?.current.label).toBe("Contraception");
    expect(NAV.map((n) => n.key).indexOf("care")).toBe(NAV.map((n) => n.key).indexOf("health") + 1);
    expect(navItemFor("/app/report")?.key).toBe("health");
    expect(navItemFor("/app/pregnancy")?.key).toBe("stage");
    expect(activeTab("/app/recommend")?.current.label).toBe("Recommend");
  });

  it("keeps Today only for /app itself", () => {
    expect(navItemFor("/app")?.key).toBe("today");
    expect(navItemFor("/app/cycle")?.key).toBe("cycle");
    expect(navItemFor("/app/more")).toBeUndefined();
  });
});
