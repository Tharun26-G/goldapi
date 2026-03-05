import { refreshPriceCache } from "./cache.js";

async function run() {
    console.log("Starting manual scraper run...");
    try {
        await refreshPriceCache();
        console.log("Manual scraper run completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Manual scraper run failed:", err);
        process.exit(1);
    }
}

run();
