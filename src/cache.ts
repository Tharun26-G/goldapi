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

    // Always load the data to memory so we have something to return immediately
    cachedData = parsed;
    console.log("Loaded existing cache from file at start");

    // Check if the file cache is still valid
    const lastUpdated = new Date(parsed.last_updated).getTime();
    const now = Date.now();

    if (now - lastUpdated >= CACHE_TTL_MS) {
      console.log("File cache is stale, triggering background refresh...");
      refreshPriceCache();
    }
  } else {
    console.log("No cache file found on startup.");
  }
} catch (err) {
  console.error("Failed to load cache from file:", err);
}

export async function refreshPriceCache() {
  // Prevent multiple concurrent refreshes
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      console.log("Refreshing price cache...");
      const freshData = await scrapePrices();
      cachedData = freshData;

      // Persist to file
      ensureCacheDir();
      fs.writeFileSync(CACHE_FILE, JSON.stringify(freshData, null, 2));

      console.log("Cache updated successfully at", new Date().toLocaleString());
    } catch (error) {
      console.error("Failed to refresh cache:", error);
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getPrices(): Promise<Prices> {
  // 1. If we have data (even if stale), return it immediately
  if (cachedData) {
    const lastUpdated = new Date(cachedData.last_updated).getTime();
    const now = Date.now();

    // If it's older than 3 hours, trigger background refresh
    if (now - lastUpdated >= CACHE_TTL_MS) {
      console.log("Cache is stale, triggering background refresh...");
      refreshPriceCache(); // Fire and forget (it handles its own promise)
    }

    // Return the data we have immediately (even if stale)
    return cachedData;
  }

  // 2. ONLY if no data at all, we must wait for a refresh
  console.log("No cache available, fetching now (initial load)...");
  await refreshPriceCache();

  if (!cachedData) {
    throw new Error("Failed to fetch prices and no cache available");
  }

  return cachedData;
}

