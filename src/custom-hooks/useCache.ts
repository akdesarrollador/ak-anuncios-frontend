import { openDB } from "idb";
import { Summary } from "../interfaces/DeviceData";

const DB_NAME = "DeviceDB";
const DEVICE_SUMMARY = "deviceSummary";
const DEVICE_CONTENT = "deviceContent";

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DEVICE_SUMMARY)) {
        db.createObjectStore(DEVICE_SUMMARY);
      }
      if (!db.objectStoreNames.contains(DEVICE_CONTENT)) {
        db.createObjectStore(DEVICE_CONTENT);
      } 
    },
  });
}

export async function saveToCache(key: string, value: any): Promise<boolean> {
  const db = await initDB();

  if(db.objectStoreNames.contains(DEVICE_CONTENT)) {
    await db.put(DEVICE_CONTENT, value, key);
    return true
  } else return false
}

export async function saveDeviceSummary(summary: Summary) {
  const db = await initDB();

  if(db.objectStoreNames.contains(DEVICE_SUMMARY)) {
    await db.put(DEVICE_SUMMARY, summary , "deviceSummary");
    return true
  } else return false
}

export async function getFromCache(key: string): Promise<Blob | null> {
  const db = await initDB();
  return await db.get(DEVICE_CONTENT, key);
}

export async function clearCache(): Promise<boolean> {
  const db = await initDB();
  const contentStoreExists = db.objectStoreNames.contains(DEVICE_CONTENT)
  const summaryStoreExists = db.objectStoreNames.contains(DEVICE_SUMMARY)

  if (!contentStoreExists && !summaryStoreExists) return true 
  
  await db.clear(DEVICE_CONTENT);
  await db.clear(DEVICE_SUMMARY);
  return true
}

export async function clearCachedContent() {
  const db = await initDB()
  await db.clear(DEVICE_CONTENT)
  return true;
}


export async function getDeviceData(): Promise<any | null> {
  const db = await initDB();
  const contentStoreExists = db.objectStoreNames.contains(DEVICE_CONTENT)
  const summaryStoreExists = db.objectStoreNames.contains(DEVICE_SUMMARY)

  if(!contentStoreExists && !summaryStoreExists) return null

  const summary = await db.get(DEVICE_SUMMARY, "deviceSummary");
  const content = await db.getAll(DEVICE_CONTENT);
  
  return { summary, content };
}
