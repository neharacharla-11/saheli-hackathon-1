/**
 * Find one file inside a .zip and stream it out, using only browser built-ins
 * (Blob.slice and DecompressionStream). Handles ZIP64 for very large exports.
 */

export interface ZipEntry {
  name: string;
  method: number; // 0 stored, 8 deflate
  compSize: number;
  dataStart: number;
}

const u16 = (v: DataView, o: number) => v.getUint16(o, true);
const u32 = (v: DataView, o: number) => v.getUint32(o, true);
const u64 = (v: DataView, o: number) => Number(v.getBigUint64(o, true));

async function view(blob: Blob, start: number, end: number): Promise<DataView> {
  return new DataView(await blob.slice(start, end).arrayBuffer());
}

/** Find the first entry whose name passes `match`. */
export async function findZipEntry(file: Blob, match: (name: string) => boolean): Promise<ZipEntry | null> {
  const tailLen = Math.min(file.size, 65_557 + 20);
  const tail = await view(file, file.size - tailLen, file.size);
  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (u32(tail, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) return null;
  let cdSize = u32(tail, eocd + 12);
  let cdOffset = u32(tail, eocd + 16);
  let count = u16(tail, eocd + 10);
  // ZIP64 end of central directory
  if ((cdOffset === 0xffffffff || count === 0xffff) && eocd >= 20 && u32(tail, eocd - 20) === 0x07064b50) {
    const z64At = u64(tail, eocd - 20 + 8);
    const z = await view(file, z64At, z64At + 56);
    if (u32(z, 0) === 0x06064b50) {
      count = u64(z, 32);
      cdSize = u64(z, 40);
      cdOffset = u64(z, 48);
    }
  }
  const cd = await view(file, cdOffset, cdOffset + cdSize);
  const dec = new TextDecoder();
  let p = 0;
  for (let n = 0; n < count && p + 46 <= cd.byteLength; n++) {
    if (u32(cd, p) !== 0x02014b50) break;
    const method = u16(cd, p + 10);
    let compSize = u32(cd, p + 20);
    const uncomp = u32(cd, p + 24);
    const nameLen = u16(cd, p + 28);
    const extraLen = u16(cd, p + 30);
    const commentLen = u16(cd, p + 32);
    let localOffset = u32(cd, p + 42);
    const name = dec.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen));
    if (match(name)) {
      // ZIP64 extra field holds the real sizes when they're 0xFFFFFFFF.
      let e = p + 46 + nameLen;
      const eEnd = e + extraLen;
      while (e + 4 <= eEnd) {
        const id = u16(cd, e);
        const size = u16(cd, e + 2);
        if (id === 0x0001) {
          let q = e + 4;
          if (uncomp === 0xffffffff) q += 8;
          if (compSize === 0xffffffff) {
            compSize = u64(cd, q);
            q += 8;
          }
          if (localOffset === 0xffffffff) localOffset = u64(cd, q);
        }
        e += 4 + size;
      }
      const lh = await view(file, localOffset, localOffset + 30);
      if (u32(lh, 0) !== 0x04034b50) return null;
      const dataStart = localOffset + 30 + u16(lh, 26) + u16(lh, 28);
      return { name, method, compSize, dataStart };
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

/** Stream an entry as text. */
export function zipEntryText(file: Blob, e: ZipEntry): ReadableStream<string> {
  const raw = file.slice(e.dataStart, e.dataStart + e.compSize).stream();
  const bytes = e.method === 8 ? raw.pipeThrough(new DecompressionStream("deflate-raw") as unknown as ReadableWritablePair<Uint8Array, Uint8Array>) : raw;
  return bytes.pipeThrough(new TextDecoderStream() as unknown as ReadableWritablePair<string, Uint8Array>);
}
