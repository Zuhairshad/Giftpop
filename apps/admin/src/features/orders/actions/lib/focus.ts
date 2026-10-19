/** The "Payment" heading on the order page: a focus target that survives a refresh of its data. */
export function paymentHeading(): HTMLElement | null {
  return document.getElementById("payment-heading");
}
