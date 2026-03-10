import express from "express";
import cron from "node-cron";
import { getPrices, refreshPriceCache } from "./cache.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Schedule cron job to run every 3 hours: "0 */3 * * *"
cron.schedule("0 */3 * * *", () => {
  console.log("Cron job triggered: Refreshing prices...");
  refreshPriceCache();
});

// Background initialization is handled inside cache.ts
// refreshPriceCache() is called automatically there if needed

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/prices", async (req, res) => {
  try {
    const prices = await getPrices();

    res.json({
      success: true,
      data: prices,
      cached_at: prices.last_updated
    });

  } catch (error: any) {
    console.error("API ERROR:", error);

    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch prices"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
