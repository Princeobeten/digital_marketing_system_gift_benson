import { NextRequest } from "next/server";
import { Campaign } from "@/models/Campaign";
import { Message } from "@/models/Message";
import { requireAuth, json, error, handleError } from "@/lib/api";
import { findSegmentMatches } from "@/lib/segments";
import { Customer } from "@/models/Customer";
import { simulateStatus, type MessageStatus } from "@/lib/simulate";
import type { CampaignChannel } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

/**
 * "Send" a campaign (simulated). Resolves the target segment to a customer
 * list, generates a Message per recipient with a simulated engagement status,
 * rolls the results up into campaign.metrics, and marks the campaign as sent.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const campaign = await Campaign.findById(id).populate("segment", "rules");
    if (!campaign) return error("Campaign not found", 404);
    if (campaign.status === "sent") {
      return error("This campaign has already been sent.", 409);
    }

    // Resolve audience: segment matches, or all customers if no segment set.
    const recipients = campaign.segment
      ? await findSegmentMatches(campaign.segment.rules || [])
      : await Customer.find().lean();

    if (recipients.length === 0) {
      return error("No customers match this campaign's segment.", 400);
    }

    const channel = campaign.channel as CampaignChannel;
    const now = new Date();
    const counts = { delivered: 0, opened: 0, clicked: 0 };

    const messages = recipients.map((c) => {
      const status: MessageStatus = simulateStatus(
        channel,
        id,
        String(c._id)
      );
      // Each higher status implies the ones below it.
      counts.delivered += 1;
      if (status === "opened" || status === "clicked") counts.opened += 1;
      if (status === "clicked") counts.clicked += 1;
      return {
        campaign: campaign._id,
        customer: c._id,
        channel,
        status,
        sentAt: now,
      };
    });

    // Replace any prior messages for idempotency, then insert fresh.
    await Message.deleteMany({ campaign: id });
    await Message.insertMany(messages);

    campaign.metrics = {
      recipients: recipients.length,
      delivered: counts.delivered,
      opened: counts.opened,
      clicked: counts.clicked,
    };
    campaign.status = "sent";
    campaign.sentAt = now;
    await campaign.save();

    return json({
      ok: true,
      metrics: campaign.metrics,
    });
  } catch (err) {
    return handleError(err);
  }
}
