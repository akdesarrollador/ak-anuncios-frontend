import { openDB } from "idb";

const DB_NAME = "ContentDB";
const STORE_NAME = "cachedContent";

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveToCache(key: string, value: Blob) {
  const db = await initDB();
  await db.put(STORE_NAME, value, key);
}

export async function getFromCache(key: string): Promise<Blob | null> {
  const db = await initDB();
  return await db.get(STORE_NAME, key);
}

export async function clearCache() {
  const db = await initDB();
  await db.clear(STORE_NAME);
}
