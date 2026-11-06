/* PIN hashing and "delete everything". Runs in the browser (and in Node for tests). */

const enc = new TextEncoder();

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomSalt(bytes = 16): string {
  return toB64(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/** SHA-256 of salt + PIN, as hex. */
export async function hashPin(pin: string, salt: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(`${salt}:${pin}`)));
}

export async function checkPin(pin: string, salt: string, hash: string): Promise<boolean> {
  return (await hashPin(pin, salt)) === hash;
}

/* ---------------- Local data ---------------- */

/** Keys that belong to Saheli. */
export function isSaheliKey(key: string): boolean {
  return key.startsWith("saheli:");
}

export function clearSaheliKeys(storage: Storage) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && isSaheliKey(k)) keys.push(k);
  }
  for (const k of keys) storage.removeItem(k);
}

/** Delete every Saheli key, every IndexedDB database on this site, and cached files. */
export async function deleteEverything(): Promise<void> {
  clearSaheliKeys(localStorage);
  try {
    sessionStorage.clear();
  } catch {}
  try {
    const dbs = (await indexedDB.databases?.()) ?? [];
    await Promise.all(
      dbs
        .filter((d) => d.name)
        .map(
          (d) =>
            new Promise<void>((resolve) => {
              const r = indexedDB.deleteDatabase(d.name as string);
              r.onsuccess = r.onerror = r.onblocked = () => resolve();
            }),
        ),
    );
  } catch {}
  try {
    if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k);
  } catch {}
}
