import { Customer } from "@/models/Customer";
import { Product } from "@/models/Product";
import { Campaign } from "@/models/Campaign";
import { Message } from "@/models/Message";
import { requireAuth, json, handleError } from "@/lib/api";

export async function GET() {
  const auth = await requireAuth();
  if ("response" in auth) return auth.response;
  try {
    const [
      totalCustomers,
      totalProducts,
      totalCampaigns,
      sentCampaigns,
      messageStats,
      categoryAgg,
      sourceAgg,
      channelAgg,
      recentCampaigns,
    ] = await Promise.all([
      Customer.countDocuments(),
      Product.countDocuments(),
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: "sent" }),
      // Roll up delivered/opened/clicked across all sent messages.
      Message.aggregate([
        {
          $group: {
            _id: null,
            delivered: { $sum: 1 },
            opened: {
              $sum: {
                $cond: [{ $in: ["$status", ["opened", "clicked"]] }, 1, 0],
              },
            },
            clicked: {
              $sum: { $cond: [{ $eq: ["$status", "clicked"] }, 1, 0] },
            },
          },
        },
      ]),
      // Customers by interest category (interests is an array → unwind).
      Customer.aggregate([
        { $unwind: { path: "$interests", preserveNullAndEmptyArrays: false } },
        { $group: { _id: "$interests", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Customers by acquisition source.
      Customer.aggregate([
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Campaign performance by channel.
      Campaign.aggregate([
        { $match: { status: "sent" } },
        {
          $group: {
            _id: "$channel",
            recipients: { $sum: "$metrics.recipients" },
            opened: { $sum: "$metrics.opened" },
            clicked: { $sum: "$metrics.clicked" },
            campaigns: { $sum: 1 },
          },
        },
      ]),
      Campaign.find({ status: "sent" })
        .select("name metrics channel sentAt")
        .sort({ sentAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const stats = messageStats[0] || { delivered: 0, opened: 0, clicked: 0 };
    const openRate =
      stats.delivered > 0
        ? Math.round((stats.opened / stats.delivered) * 100)
        : 0;
    const clickRate =
      stats.delivered > 0
        ? Math.round((stats.clicked / stats.delivered) * 100)
        : 0;

    return json({
      kpis: {
        totalCustomers,
        totalProducts,
        totalCampaigns,
        sentCampaigns,
        messagesSent: stats.delivered,
        openRate,
        clickRate,
      },
      customersByCategory: categoryAgg.map((c) => ({
        category: c._id,
        count: c.count,
      })),
      customersBySource: sourceAgg.map((s) => ({
        source: s._id || "Unknown",
        count: s.count,
      })),
      channelPerformance: channelAgg.map((c) => ({
        channel: (c._id as string).toUpperCase(),
        recipients: c.recipients,
        opened: c.opened,
        clicked: c.clicked,
        campaigns: c.campaigns,
      })),
      recentCampaigns,
    });
  } catch (err) {
    return handleError(err);
  }
}
