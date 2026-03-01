import { scrapePrices } from "./scraper/scrape.js";
import { Prices } from "./types.js";

let cachedData: Prices | null = null;
let lastFetchTime = 0;

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function getPrices(): Promise<Prices> {
  const now = Date.now();

  if (cachedData && now - lastFetchTime < CACHE_DURATION) {
    console.log("Returning cached data");
    return cachedData;
  }

  console.log("Fetching fresh data...");
  const freshData = await scrapePrices();

  cachedData = freshData;
  lastFetchTime = now;

  return freshData;
}