import { kv } from "@vercel/kv";
import { after } from "next/server";

// Stale-while-revalidate over KV. Fresh hits return immediately; STALE hits ALSO return
// immediately (so the page never waits on Shopify twice) and recompute in the background via
// after(); only a true miss blocks on compute(). Errors in compute() on a miss propagate.
interface Entry<T> { data: T; at: number }

export async function swrCache<T>(
  key: string,
  freshSec: number,
  keepSec: number,
  compute: () => Promise<T>,
): Promise<T> {
  let hit: Entry<T> | null = null;
  try { hit = await kv.get<Entry<T>>(key); } catch { /* KV down → compute */ }

  const store = (data: T) => kv.set(key, { data, at: Date.now() }, { ex: keepSec }).catch(() => {});

  if (hit && typeof hit.at === "number") {
    if (Date.now() - hit.at > freshSec * 1000) {
      after(async () => {
        // One refresher at a time per key, so several tabs opening at once don't all hit Shopify.
        const gotLock = await kv.set(`${key}:refreshing`, 1, { nx: true, ex: 60 }).catch(() => "OK");
        if (!gotLock) return;
        // Background refresh: a failure just leaves the stale copy for the next request.
        try { await store(await compute()); } catch { /* keep stale */ }
      });
    }
    return hit.data;
  }

  const data = await compute();
  store(data);
  return data;
}
