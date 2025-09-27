export const formatCurrency = (
  amount: number,
  currencyCode: string,
  fractionDigits = 2,
): string => {
  const code = currencyCode || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch (_error) {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }
};
