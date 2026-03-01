export const cleanPrice = (value: string | null): number => {
    if (!value) return 0;
  
    return Number(
      value.replace(/[₹,]/g, "").trim()
    );
  };