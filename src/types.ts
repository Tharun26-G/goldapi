export interface Prices {
    gold: {
      "22k_per_gram": number;
      "22k_per_sovereign": number;
      "24k_per_gram": number;
      "24k_per_sovereign": number;
    };
    silver: {
      per_kg: number;
      per_gram: number;
    };
    last_updated: string;
  }