# Gold & Silver Price API

A simple and automated API that provides live gold and silver prices for Chennai, India. It scrapes data from real websites and serves it through a fast API with built-in caching.

## How it Works (Process Flow)

1.  **Request**: When you call the `/prices` endpoint, the server first checks its local "memory" or a file named `prices.json` for data.
2.  **Cache Logic**:
    *   **Fresh Data**: If the price was updated less than 3 hours ago, it sends it back immediately.
    *   **Old Data (Stale)**: If the data is older than 3 hours, the server sends you the old price immediately (so you don't wait) but starts a "background worker" to fetch the newest prices for the next person.
    *   **Empty Start**: If there is no data at all, the server scrapes the website first and then sends the response.
3.  **The Scraper**: The app uses a tool called **Playwright** (a headless browser) to visit price tracking websites. It finds the specific text for 22K Gold, 24K Gold, and Silver, cleans the text into numbers, and saves it.
4.  **Automation**:
    *   **Internal Cron**: The server has a built-in timer that refreshes prices every 3 hours automatically.
    *   **GitHub Actions**: A script runs every 3 hours to make sure the server stays "awake" and triggers updates.

## Technical Details

*   **Language**: Built with **TypeScript** and **Node.js** for reliable and fast code.
*   **Web Framework**: Uses **Express.js** to handle API requests.
*   **Web Scraper**: Uses **Playwright** to extract data from websites like GoodReturns.
*   **Caching**: Stores data in a local JSON file (`cache/prices.json`) so it doesn't have to scrape the website every single time someone visits.
*   **Environment**: Designed to run on **Render** using both a Web Service (for the API) and a Cron Job (for the automated scraping).

## API Endpoints

### Get Current Prices
*   **URL**: `/prices`
*   **Method**: `GET`
*   **Response**:
    ```json
    {
      "success": true,
      "data": {
        "gold": {
          "22k_per_gram": 7500,
          "22k_per_sovereign": 60000,
          ...
        },
        "silver": {
          "per_kg": 95000,
          ...
        },
        "last_updated": "2024-03-20T12:00:00Z"
      }
    }
    ```

### Health Check
*   **URL**: `/health`
*   **Method**: `GET`
*   **Response**: `OK` (Used to check if the server is running).
