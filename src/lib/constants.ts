/** Shared domain constants used across the app. */

/** Gadget product categories a retailer deals in. */
export const GADGET_CATEGORIES = [
  "Smartphones",
  "Laptops",
  "Tablets",
  "Smartwatches",
  "Headphones & Audio",
  "Gaming",
  "Cameras",
  "Accessories",
] as const;

export type GadgetCategory = (typeof GADGET_CATEGORIES)[number];

/** Channels a campaign can be delivered through (all simulated in this prototype). */
export const CAMPAIGN_CHANNELS = ["email", "sms", "social"] as const;
export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];

/** Where a customer record originated from. */
export const CUSTOMER_SOURCES = [
  "Walk-in",
  "Website",
  "Instagram",
  "WhatsApp",
  "Referral",
  "Facebook",
] as const;

/** Fields available when building a customer segment rule. */
export const SEGMENT_FIELDS = [
  { value: "interests", label: "Interest (category)", type: "category" },
  { value: "location", label: "Location", type: "text" },
  { value: "source", label: "Acquisition source", type: "source" },
  { value: "totalSpend", label: "Total spend (₦)", type: "number" },
  { value: "tags", label: "Tag", type: "text" },
] as const;

export type SegmentField = (typeof SEGMENT_FIELDS)[number]["value"];

/** Operators available per field type. */
export const SEGMENT_OPERATORS = [
  { value: "eq", label: "is equal to" },
  { value: "ne", label: "is not equal to" },
  { value: "contains", label: "contains" },
  { value: "gt", label: "is greater than" },
  { value: "gte", label: "is greater than or equal to" },
  { value: "lt", label: "is less than" },
  { value: "lte", label: "is less than or equal to" },
] as const;

export type SegmentOperator = (typeof SEGMENT_OPERATORS)[number]["value"];

export const USER_ROLES = ["admin", "marketer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Currency formatter for Nigerian Naira (the gadget retail context in the doc). */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
