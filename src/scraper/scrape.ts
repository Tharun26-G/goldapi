import { chromium } from "playwright";
import { cleanPrice } from "../utils/parser.js";
import type { Prices } from "../types.js";

export async function scrapePrices(): Promise<Prices> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  try {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    });

    // Helper to scrape a single page
    const scrapePage = async (url: string, selector: string) => {
      const page = await context.newPage();
      // Block images/styles/etc.
      await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,css,font,woff,woff2,google-analytics,doubleclick,adsense}", (route) => route.abort());

      console.log(`Opening ${url}...`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForSelector(selector, { timeout: 45000 });

      const content = await page.content();
      const results: string[] = [];

      if (url.includes("gold")) {
        results.push(await page.locator('[id="22K-price"]').first().textContent() || "");
        results.push(await page.locator('[id="24K-price"]').first().textContent() || "");
      } else {
        results.push(await page.locator("#silver-1kg-price").first().textContent() || "");
        results.push(await page.locator("#silver-1g-price").first().textContent() || "");
      }

      await page.close();
      return results;
    };

    // Run scraping in parallel
    const [goldResults, silverResults] = await Promise.all([
      scrapePage("https://www.goodreturns.in/gold-rates/chennai.html", '[id="22K-price"]'),
      scrapePage("https://www.goodreturns.in/silver-rates/chennai.html", "#silver-1kg-price")
    ]);

    const price22k = cleanPrice(goldResults[0]);
    const price24k = cleanPrice(goldResults[1]);
    const silver1kg = cleanPrice(silverResults[0]);
    const silver1g = cleanPrice(silverResults[1]);

    const result: Prices = {
      gold: {
        "22k_per_gram": price22k,
        "22k_per_sovereign": price22k * 8,
        "24k_per_gram": price24k,
        "24k_per_sovereign": price24k * 8
      },
      silver: {
        per_kg: silver1kg,
        per_gram: silver1g
      },
      last_updated: new Date().toISOString()
    };

    return result;

  } catch (error) {
    console.error("Scraping failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}
