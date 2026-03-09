import { scrapePrices } from "./scraper/scrape.js";
import { Prices } from "./types.js";
import fs from "fs";
import path from "path";

const CACHE_FILE = path.join(process.cwd(), "cache/prices_cache.json");
const CACHE_DIR = path.join(process.cwd(), "cache");
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

let cachedData: Prices | null = null;
let refreshPromise: Promise<void> | null = null;

// Helper to ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Try to load initial cache from file
try {
  ensureCacheDir();
  if (fs.existsSync(CACHE_FILE)) {
    const data = fs.readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(data);

    // Check if the file cache is still valid (less than 3 hours old)
    const lastUpdated = new Date(parsed.last_updated).getTime();
    const now = new Date().getTime();

    if (now - lastUpdated < CACHE_TTL_MS) {
      cachedData = parsed;
      console.log("Loaded fresh cache from file");
    } else {
      console.log("File cache is stale, will need refresh");
    }
  }
} catch (err) {
  console.error("Failed to load cache from file:", err);
}

export async function refreshPriceCache() {
  // Prevent multiple concurrent refreshes
  if (refreshPromise) {
    console.log("Refresh already in progress, waiting...");
    return refreshPromise;
  }

  console.log("Refreshing price cache...");
  refreshPromise = (async () => {
    try {
      const freshData = await scrapePrices();
      cachedData = freshData;

      // Persist to file
      ensureCacheDir();
      fs.writeFileSync(CACHE_FILE, JSON.stringify(freshData, null, 2));

      console.log("Cache updated successfully at", new Date().toLocaleString());
    } catch (error) {
      console.error("Failed to refresh cache:", error);
      // Don't throw here, just log so the promise settles
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getPrices(): Promise<Prices> {
  // 1. If we have data, check if it's still fresh
  if (cachedData) {
    const lastUpdated = new Date(cachedData.last_updated).getTime();
    const now = new Date().getTime();

    // If it's less than 3 hours old, return it immediately
    if (now - lastUpdated < CACHE_TTL_MS) {
      return cachedData;
    }

    // If it's older than 3 hours, trigger background refresh but return stale data for speed
    console.log("Cache is stale, triggering background refresh...");
    refreshPriceCache();
    return cachedData;
  }

  // 2. If no data at all, we must wait for a refresh
  console.log("No cache available, fetching now...");
  await refreshPriceCache();

  if (!cachedData) {
    throw new Error("Failed to fetch prices and no cache available");
  }

  return cachedData;
}

