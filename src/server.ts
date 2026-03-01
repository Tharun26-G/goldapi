import express from "express";
import { getPrices } from "./cache.js";

const app = express();
const PORT = 3000;

app.get("/prices", async (req, res) => {
  try {
    const prices = await getPrices();

    res.json({
      success: true,
      data: prices
    });

  } catch (error: any) {
    console.error("SCRAPER ERROR:", error);

    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch prices"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});