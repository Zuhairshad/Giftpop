/** "Usually 3 to 7 days", from a country's `shipping.deliveryDays`. */
export function deliveryEstimate(days: { min: number; max: number }): string {
  const { min, max } = days;
  if (max <= 0) return "Usually the same day";
  if (min === max) return `Usually ${max} ${max === 1 ? "day" : "days"}`;
  if (min <= 0) return `Usually within ${max} ${max === 1 ? "day" : "days"}`;
  return `Usually ${min} to ${max} days`;
}
