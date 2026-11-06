/**
 * Report files stay on her phone, in IndexedDB. Nothing here is uploaded
 * except the one-off read request she starts herself.
 */

const DB_NAME = "saheli-files";
const STORE = "reports";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("No IndexedDB"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveReportFile(id: string, blob: Blob): Promise<void> {
  await run("readwrite", (s) => s.put(blob, id));
}

export async function getReportFile(id: string): Promise<Blob | undefined> {
  return (await run<Blob | undefined>("readonly", (s) => s.get(id))) ?? undefined;
}

export async function deleteReportFile(id: string): Promise<void> {
  await run("readwrite", (s) => s.delete(id));
}

/* ---------------- Preparing files for reading ---------------- */

export const MAX_PDF_BYTES = 3 * 1024 * 1024;

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).replace(/^data:[^,]+,/, ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Resize a photo so its longest side is at most maxSide, as JPEG. */
export async function resizeImage(file: Blob, maxSide = 2000, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  let w: number, h: number, source: CanvasImageSource;
  if (bitmap) {
    w = bitmap.width;
    h = bitmap.height;
    source = bitmap;
  } else {
    // Older Safari: fall back to an <img>.
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Couldn't open that photo"));
      i.src = url;
    });
    URL.revokeObjectURL(url);
    w = img.naturalWidth;
    h = img.naturalHeight;
    source = img;
  }
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't prepare that photo");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(source, 0, 0, cw, ch);
  bitmap?.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't prepare that photo"))), "image/jpeg", quality),
  );
}
