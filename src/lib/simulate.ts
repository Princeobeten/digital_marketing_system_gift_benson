import type { CampaignChannel } from "./constants";

/**
 * Deterministic pseudo-random in [0, 1) derived from a string seed.
 * We avoid Math.random so that a given (campaign, customer) pair always
 * produces the same simulated outcome — useful for reproducible demos.
 */
export function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Map to [0, 1)
  return ((h >>> 0) % 100000) / 100000;
}

/** Typical open/click rates per channel (delivered is assumed 100% in this prototype). */
const CHANNEL_RATES: Record<CampaignChannel, { open: number; click: number }> = {
  email: { open: 0.55, click: 0.22 },
  sms: { open: 0.9, click: 0.32 },
  social: { open: 0.42, click: 0.16 },
};

export type MessageStatus = "delivered" | "opened" | "clicked";

/** Decide a single recipient's simulated engagement status. */
export function simulateStatus(
  channel: CampaignChannel,
  campaignId: string,
  customerId: string
): MessageStatus {
  const rates = CHANNEL_RATES[channel] ?? CHANNEL_RATES.email;
  const openRoll = seededRandom(`${campaignId}:${customerId}:open`);
  if (openRoll > rates.open) return "delivered";
  const clickRoll = seededRandom(`${campaignId}:${customerId}:click`);
  // Click rate is expressed over the whole audience, so normalize within openers.
  return clickRoll < rates.click / rates.open ? "clicked" : "opened";
}
