import type { OrderStatus } from "@giftpop/contracts";

/** Which dialog a target status needs. */
export type StatusDialogKind = "ship" | "cancel" | "confirm";

export interface StatusAction {
  /** Menu item and submit button: says what will happen. */
  label: string;
  /** One plain sentence under the dialog title. */
  description: string;
  dialog: StatusDialogKind;
}

/** The one place that turns a target status into staff-facing action words. */
export const STATUS_ACTIONS: Readonly<Record<OrderStatus, StatusAction>> = {
  awaiting_payment: {
    label: "Mark as awaiting payment",
    description: "The order goes back to waiting for payment.",
    dialog: "confirm",
  },
  confirmed: {
    label: "Confirm order",
    description: "Payment is in and the order is ready to make.",
    dialog: "confirm",
  },
  in_production: {
    label: "Start production",
    description: "The team has started making this gift.",
    dialog: "confirm",
  },
  packed: {
    label: "Mark as packed",
    description: "The gift is packed and waiting for the courier.",
    dialog: "confirm",
  },
  shipped: {
    label: "Mark as shipped",
    description: "Record who is carrying the parcel. The customer sees this on the tracking page.",
    dialog: "ship",
  },
  out_for_delivery: {
    label: "Mark as out for delivery",
    description: "The local courier has the parcel and is on the way.",
    dialog: "confirm",
  },
  delivery_failed: {
    label: "Mark delivery as failed",
    description: "The courier could not hand the parcel over.",
    dialog: "confirm",
  },
  delivered: {
    label: "Mark as delivered",
    description: "The customer has the gift. This closes the order.",
    dialog: "confirm",
  },
  returned: {
    label: "Mark as returned",
    description: "The parcel came back to us. This closes the order.",
    dialog: "confirm",
  },
  cancelled: {
    label: "Cancel order",
    description: "Say why this order is being cancelled.",
    dialog: "cancel",
  },
};

export const CANCEL_WARNING = "This puts the items back in stock and cannot be undone";
export const NO_FURTHER_STEPS = "No further steps";

export function actionFor(status: OrderStatus): StatusAction {
  return STATUS_ACTIONS[status];
}
