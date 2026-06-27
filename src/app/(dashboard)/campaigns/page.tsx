"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { api } from "@/lib/fetcher";
import type { Campaign, Product, Segment } from "@/lib/types";
import { CAMPAIGN_CHANNELS } from "@/lib/constants";

type SegmentLite = Pick<Segment, "_id" | "name">;

const statusColor = {
  draft: "slate",
  scheduled: "amber",
  sent: "green",
} as const;

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<SegmentLite[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // AI assist state
  const [aiOffer, setAiOffer] = useState("");
  const [aiTone, setAiTone] = useState("friendly and persuasive");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [form, setForm] = useState({
    name: "",
    channel: "email" as Campaign["channel"],
    segment: "",
    products: [] as string[],
    subject: "",
    body: "",
    scheduledAt: "",
  });

  async function load() {
    setLoading(true);
    try {
      const [c, s, p] = await Promise.all([
        api.get<{ campaigns: Campaign[] }>("/api/campaigns"),
        api.get<{ segments: SegmentLite[] }>("/api/segments"),
        api.get<{ products: Product[] }>("/api/products"),
      ]);
      setCampaigns(c.campaigns);
      setSegments(s.segments);
      setProducts(p.products);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm({
      name: "",
      channel: "email",
      segment: "",
      products: [],
      subject: "",
      body: "",
      scheduledAt: "",
    });
    setAiOffer("");
    setAiError("");
    setFormError("");
    setModalOpen(true);
  }

  async function generateWithAI() {
    if (!aiOffer.trim()) {
      setAiError("Describe the offer or goal first.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    const selectedProduct = products.find((p) => form.products.includes(p._id));
    try {
      const res = await api.post<{
        subject: string;
        body: string;
        suggestedSegment?: string;
      }>("/api/ai/generate-campaign", {
        offer: aiOffer,
        tone: aiTone,
        channel: form.channel,
        productName: selectedProduct?.name || "",
        category: selectedProduct?.category || "",
      });
      setForm((f) => ({
        ...f,
        subject: res.subject || f.subject,
        body: res.body || f.body,
      }));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      products: f.products.includes(id)
        ? f.products.filter((p) => p !== id)
        : [...f.products, id],
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await api.post("/api/campaigns", {
        ...form,
        segment: form.segment || null,
        scheduledAt: form.scheduledAt || null,
      });
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Create, target, and track your marketing campaigns from one place."
        action={<Button onClick={openCreate}>+ New campaign</Button>}
      />

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Build your first campaign and target a customer segment."
          action={<Button onClick={openCreate}>+ New campaign</Button>}
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const seg = c.segment as Segment | null;
            const openRate =
              c.metrics.delivered > 0
                ? Math.round((c.metrics.opened / c.metrics.delivered) * 100)
                : 0;
            return (
              <Link key={c._id} href={`/campaigns/${c._id}`}>
                <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-slate-900">
                        {c.name}
                      </h3>
                      <Badge color={statusColor[c.status]}>{c.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {c.channel.toUpperCase()} ·{" "}
                      {seg?.name ? `Segment: ${seg.name}` : "All customers"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-center sm:gap-6">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {c.metrics.recipients}
                      </p>
                      <p className="text-[11px] text-slate-400">recipients</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {openRate}%
                      </p>
                      <p className="text-[11px] text-slate-400">open rate</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New campaign"
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Campaign name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. iPhone 15 launch promo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Channel</Label>
              <Select
                value={form.channel}
                onChange={(e) =>
                  setForm({
                    ...form,
                    channel: e.target.value as Campaign["channel"],
                  })
                }
              >
                {CAMPAIGN_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch.toUpperCase()}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Target segment</Label>
              <Select
                value={form.segment}
                onChange={(e) => setForm({ ...form, segment: e.target.value })}
              >
                <option value="">All customers</option>
                {segments.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>Promoted products</Label>
            <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
              {products.length === 0 && (
                <p className="text-xs text-slate-400">No products yet.</p>
              )}
              {products.map((p) => {
                const active = form.products.includes(p._id);
                return (
                  <button
                    type="button"
                    key={p._id}
                    onClick={() => toggleProduct(p._id)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      active
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI assist */}
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-indigo-900">
                ✨ AI Campaign Assistant
              </span>
              {/* <span className="text-[11px] text-indigo-500">powered by Groq</span> */}
            </div>
            <Input
              value={aiOffer}
              onChange={(e) => setAiOffer(e.target.value)}
              placeholder="Describe the offer/goal e.g. 20% off all smartphones this weekend"
              className="mb-2 bg-white"
            />
            <div className="flex gap-2">
              <Select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="flex-1 bg-white"
              >
                <option value="friendly and persuasive">
                  Friendly & persuasive
                </option>
                <option value="urgent and exciting">Urgent & exciting</option>
                <option value="professional and concise">
                  Professional & concise
                </option>
                <option value="playful and fun">Playful & fun</option>
              </Select>
              <Button
                type="button"
                onClick={generateWithAI}
                disabled={aiLoading}
              >
                {aiLoading ? "Generating…" : "Generate copy"}
              </Button>
            </div>
            {aiError && (
              <p className="mt-2 text-xs text-red-600">{aiError}</p>
            )}
          </div>

          <div>
            <Label>Subject / Headline</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Grab the latest gadgets at unbeatable prices!"
            />
          </div>
          <div>
            <Label>Message body</Label>
            <Textarea
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write your campaign message, or generate it with AI above."
            />
          </div>

          <div>
            <Label>Schedule for (optional)</Label>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) =>
                setForm({ ...form, scheduledAt: e.target.value })
              }
            />
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create campaign"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
