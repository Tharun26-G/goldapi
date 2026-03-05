import { scrapePrices } from "./scraper/scrape.js";
import { Prices } from "./types.js";
import fs from "fs";
import path from "path";

const CACHE_FILE = path.join(process.cwd(), "prices_cache.json");
let cachedData: Prices | null = null;

// Try to load initial cache from file
try {
  if (fs.existsSync(CACHE_FILE)) {
    const data = fs.readFileSync(CACHE_FILE, "utf-8");
    cachedData = JSON.parse(data);
    console.log("Loaded cache from file");
  }
} catch (err) {
  console.error("Failed to load cache from file:", err);
}

export async function refreshPriceCache() {
  console.log("Refreshing price cache...");
  try {
    const freshData = await scrapePrices();
    cachedData = freshData;

    // Persist to file
    fs.writeFileSync(CACHE_FILE, JSON.stringify(freshData, null, 2));

    console.log("Cache updated successfully at", new Date().toLocaleString());
  } catch (error) {
    console.error("Failed to refresh cache:", error);
  }
}

export async function getPrices(): Promise<Prices> {
  if (cachedData) {
    return cachedData;
  }

  // If no cache, fetch once synchronously (first request penalty)
  await refreshPriceCache();

  if (!cachedData) {
    throw new Error("Failed to fetch prices and no cache available");
  }

  return cachedData;
}

