/* Saheli service worker: offline pages and reminder notifications.
 * Pages: network first, then the cached page, then /app, then /offline.html.
 * /_next/static and images: cache first. /api is never cached.
 */
const VERSION = "v1";
const PAGES = `saheli-pages-${VERSION}`;
const STATIC = `saheli-static-${VERSION}`;
const DATA = "saheli-data";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGES);
      await cache.addAll([OFFLINE]).catch(() => {});
      await cache.add("/app").catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = [PAGES, STATIC, DATA];
      for (const key of await caches.keys()) if (!keep.includes(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

function isStatic(url, request) {
  return url.pathname.startsWith("/_next/static/") || request.destination === "image" || request.destination === "font" || /\.(png|jpe?g|svg|webp|gif|ico|woff2?)$/i.test(url.pathname);
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(request);
    if (res.ok && res.type === "basic") cache.put(request, res.clone());
    return res;
  } catch {
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match("/app")) ||
      (await cache.match(OFFLINE)) ||
      new Response("You're offline.", { status: 503, headers: { "Content-Type": "text/plain" } })
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && (res.type === "basic" || res.type === "cors")) cache.put(request, res.clone());
  return res;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;
  // Next.js client navigations: if offline, let it fail so the browser loads the cached page.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;
  if (request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (isStatic(url, request)) event.respondWith(cacheFirst(request));
});

/* ---------- Save every menu page and its scripts ---------- */

async function precache(urls) {
  const pages = await caches.open(PAGES);
  const stat = await caches.open(STATIC);
  const assets = new Set();
  for (const u of urls) {
    try {
      const res = await fetch(u, { credentials: "same-origin" });
      if (!res.ok) continue;
      await pages.put(u, res.clone());
      const html = await res.text();
      for (const m of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) assets.add(m[0]);
    } catch {
      // offline or a page failed: try again next time
    }
  }
  for (const a of assets) {
    if (await stat.match(a)) continue;
    try {
      const res = await fetch(a);
      if (res.ok) await stat.put(a, res);
    } catch {}
  }
}

/* ---------- Reminders ---------- */

async function readData(key, fallback) {
  const cache = await caches.open(DATA);
  const res = await cache.match(`/__saheli/${key}`);
  if (!res) return fallback;
  try {
    return await res.json();
  } catch {
    return fallback;
  }
}

async function writeData(key, value) {
  const cache = await caches.open(DATA);
  await cache.put(`/__saheli/${key}`, new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } }));
}

function dayOf(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function atTime(date, time) {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

/** Same rule as dueReminders() in src/lib/reminders.ts. */
async function checkReminders() {
  const state = await readData("reminders", null);
  if (!state || !state.enabled || !Array.isArray(state.items)) return;
  const now = Date.now();
  const since = Math.max(state.lastCheck || 0, now - 30 * 60000);
  const days = [...new Set([dayOf(since), dayOf(now)])];
  for (const r of state.items) {
    const dates = r.repeat === "once" ? (r.date ? [r.date] : []) : days;
    for (const d of dates) {
      const t = atTime(d, r.time);
      if (t > since && t <= now) {
        await self.registration.showNotification(r.title, {
          body: r.body,
          tag: `${r.id}-${d}`,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          data: { url: r.kind === "period" ? "/app/cycle" : "/app/checklist" },
        });
      }
    }
  }
  state.lastCheck = now;
  await writeData("reminders", state);
}

self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "precache" && Array.isArray(msg.urls)) event.waitUntil(precache(msg.urls));
  else if (msg.type === "reminders") {
    event.waitUntil(
      (async () => {
        const prev = await readData("reminders", {});
        await writeData("reminders", { enabled: !!msg.enabled, items: msg.items || [], lastCheck: prev.lastCheck || Date.now() });
      })(),
    );
  } else if (msg.type === "check") event.waitUntil(checkReminders());
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "saheli-reminders") event.waitUntil(checkReminders());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/app";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if ("focus" in c) {
          await c.focus();
          if ("navigate" in c) await c.navigate(url).catch(() => {});
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
