"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui";

interface Overview {
  kpis: {
    totalCustomers: number;
    totalProducts: number;
    totalCampaigns: number;
    sentCampaigns: number;
    messagesSent: number;
    openRate: number;
    clickRate: number;
  };
  customersByCategory: { category: string; count: number }[];
  customersBySource: { source: string; count: number }[];
  channelPerformance: {
    channel: string;
    recipients: number;
    opened: number;
    clicked: number;
    campaigns: number;
  }[];
  recentCampaigns: {
    _id: string;
    name: string;
    channel: string;
    metrics: { recipients: number; opened: number; clicked: number };
  }[];
}

const PIE_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/overview")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!data) return <p className="text-sm text-slate-500">No data.</p>;

  const k = data.kpis;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your marketing performance at a glance."
      />

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Customers" value={k.totalCustomers} icon="👥" />
        <Kpi label="Products" value={k.totalProducts} icon="📱" />
        <Kpi label="Campaigns" value={k.totalCampaigns} icon="📣" />
        <Kpi label="Messages sent" value={k.messagesSent} icon="✉️" />
        <Kpi label="Sent campaigns" value={k.sentCampaigns} icon="🚀" />
        <Kpi label="Avg open rate" value={`${k.openRate}%`} icon="📬" />
        <Kpi label="Avg click rate" value={`${k.clickRate}%`} icon="🖱️" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Customers by category */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            Customers by interest category
          </h2>
          {data.customersByCategory.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.customersByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Customers by source */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            Acquisition source
          </h2>
          {data.customersBySource.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.customersBySource}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry: { name?: string }) => entry.name ?? ""}
                >
                  {data.customersBySource.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Channel performance */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            Campaign performance by channel
          </h2>
          {data.channelPerformance.length === 0 ? (
            <Empty message="Send a campaign to see channel performance." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.channelPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="recipients"
                  name="Recipients"
                  fill="#cbd5e1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="opened"
                  name="Opened"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="clicked"
                  name="Clicked"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}

function Empty({ message = "No data yet." }: { message?: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
      {message}
    </div>
  );
}
