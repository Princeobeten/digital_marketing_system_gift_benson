"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { api } from "@/lib/fetcher";
import type { Campaign } from "@/lib/types";

interface MessageRow {
  _id: string;
  status: "delivered" | "opened" | "clicked";
  sentAt: string;
  customer?: { name: string; email: string } | null;
}

interface PopulatedSegment {
  _id: string;
  name: string;
}
interface PopulatedProduct {
  _id: string;
  name: string;
  price: number;
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<{ campaign: Campaign; messages: MessageRow[] }>(
        `/api/campaigns/${id}`
      );
      setCampaign(data.campaign);
      setMessages(data.messages);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function send() {
    if (!confirm("Send this campaign to all matching customers?")) return;
    setSending(true);
    setError("");
    try {
      await api.post(`/api/campaigns/${id}/send`, {});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    await api.del(`/api/campaigns/${id}`);
    router.push("/campaigns");
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!campaign) return <p className="text-sm text-slate-500">Not found.</p>;

  const m = campaign.metrics;
  const rate = (n: number) =>
    m.delivered > 0 ? Math.round((n / m.delivered) * 100) : 0;
  const seg = campaign.segment as PopulatedSegment | null;
  const products = (campaign.products as PopulatedProduct[]) || [];

  return (
    <div>
      <Link
        href="/campaigns"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← Back to campaigns
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {campaign.name}
            </h1>
            <Badge
              color={
                campaign.status === "sent"
                  ? "green"
                  : campaign.status === "scheduled"
                  ? "amber"
                  : "slate"
              }
            >
              {campaign.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {campaign.channel.toUpperCase()} ·{" "}
            {seg?.name ? `Segment: ${seg.name}` : "All customers"}
          </p>
        </div>
        <div className="flex gap-2">
          {campaign.status !== "sent" && (
            <Button onClick={send} disabled={sending}>
              {sending ? "Sending…" : "🚀 Send campaign"}
            </Button>
          )}
          <Button variant="danger" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Recipients" value={m.recipients} />
        <Metric label="Delivered" value={m.delivered} />
        <Metric
          label="Opened"
          value={m.opened}
          sub={`${rate(m.opened)}% open rate`}
        />
        <Metric
          label="Clicked"
          value={m.clicked}
          sub={`${rate(m.clicked)}% click rate`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Content */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Message content
          </h2>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Subject
          </p>
          <p className="mb-3 font-medium text-slate-900">
            {campaign.subject || "—"}
          </p>
          <p className="text-xs uppercase tracking-wide text-slate-400">Body</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {campaign.body || "—"}
          </p>
          {products.length > 0 && (
            <div className="mt-4">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                Promoted products
              </p>
              <div className="flex flex-wrap gap-1.5">
                {products.map((p) => (
                  <Badge key={p._id} color="indigo">
                    {p.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Message log */}
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Delivery log
          </h2>
          {messages.length === 0 ? (
            <p className="text-sm text-slate-400">
              No messages yet. Send the campaign to generate the delivery log.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate text-slate-600">
                    {msg.customer?.name || "Unknown"}
                  </span>
                  <Badge
                    color={
                      msg.status === "clicked"
                        ? "green"
                        : msg.status === "opened"
                        ? "indigo"
                        : "slate"
                    }
                  >
                    {msg.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}
