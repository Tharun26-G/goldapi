import { chromium } from "playwright";
import { cleanPrice } from "../utils/parser.js";
import type { Prices } from "../types.js";

export async function scrapePrices(): Promise<Prices> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"]
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  try {
    console.log("Opening gold page...");

    // GOLD PAGE
    await page.goto(
      "https://www.goodreturns.in/gold-rates/chennai.html",
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    await page.waitForSelector('[id="22K-price"]', { timeout: 60000 });

    const price22kRaw = await page
      .locator('[id="22K-price"]')
      .first()
      .textContent();

    const price24kRaw = await page
      .locator('[id="24K-price"]')
      .first()
      .textContent();

    const price22k = cleanPrice(price22kRaw);
    const price24k = cleanPrice(price24kRaw);

    console.log("Opening silver page...");

    // SILVER PAGE
    await page.goto(
      "https://www.goodreturns.in/silver-rates/chennai.html",
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    await page.waitForSelector("#silver-1kg-price", { timeout: 60000 });

    const silver1kgRaw = await page
      .locator("#silver-1kg-price")
      .first()
      .textContent();

    const silver1gRaw = await page
      .locator("#silver-1g-price")
      .first()
      .textContent();

    const silver1kg = cleanPrice(silver1kgRaw);
    const silver1g = cleanPrice(silver1gRaw);

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