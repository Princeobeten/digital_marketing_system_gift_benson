"use client";

import { useEffect, useState } from "react";
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
} from "@/components/ui";
import { api } from "@/lib/fetcher";
import type { Customer } from "@/lib/types";
import {
  CUSTOMER_SOURCES,
  GADGET_CATEGORIES,
  formatNaira,
} from "@/lib/constants";

const EMPTY: Partial<Customer> = {
  name: "",
  email: "",
  phone: "",
  location: "",
  interests: [],
  tags: [],
  totalSpend: 0,
  source: "Walk-in",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Customer>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load(q = "") {
    setLoading(true);
    try {
      const { customers } = await api.get<{ customers: Customer[] }>(
        `/api/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`
      );
      setCustomers(customers);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing({ ...EMPTY });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing({ ...c });
    setFormError("");
    setModalOpen(true);
  }

  function toggleInterest(cat: string) {
    const current = editing.interests || [];
    setEditing({
      ...editing,
      interests: current.includes(cat)
        ? current.filter((i) => i !== cat)
        : [...current, cat],
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const payload = {
      name: editing.name,
      email: editing.email,
      phone: editing.phone,
      location: editing.location,
      interests: editing.interests || [],
      tags:
        typeof editing.tags === "string"
          ? (editing.tags as string).split(",").map((t) => t.trim()).filter(Boolean)
          : editing.tags || [],
      totalSpend: Number(editing.totalSpend) || 0,
      source: editing.source,
    };
    try {
      if (editing._id) {
        await api.put(`/api/customers/${editing._id}`, payload);
      } else {
        await api.post("/api/customers", payload);
      }
      setModalOpen(false);
      load(query);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Customer) {
    if (!confirm(`Delete ${c.name}?`)) return;
    await api.del(`/api/customers/${c._id}`);
    load(query);
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Your customer database — the foundation for segmentation and targeting."
        action={<Button onClick={openCreate}>+ Add customer</Button>}
      />

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search by name, email or location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(query)}
          className="max-w-sm"
        />
        <Button variant="secondary" onClick={() => load(query)}>
          Search
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer or run the seed script to load demo data."
          action={<Button onClick={openCreate}>+ Add customer</Button>}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-170 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Interests</th>
                <th className="px-4 py-3 font-medium">Total spend</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.location || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.interests.slice(0, 2).map((i) => (
                        <Badge key={i} color="indigo">
                          {i}
                        </Badge>
                      ))}
                      {c.interests.length > 2 && (
                        <Badge>+{c.interests.length - 2}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatNaira(c.totalSpend)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{c.source}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(c)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => remove(c)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing._id ? "Edit customer" : "Add customer"}
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input
                value={editing.name || ""}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editing.email || ""}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={editing.phone || ""}
                onChange={(e) =>
                  setEditing({ ...editing, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={editing.location || ""}
                onChange={(e) =>
                  setEditing({ ...editing, location: e.target.value })
                }
                placeholder="e.g. Lagos"
              />
            </div>
            <div>
              <Label>Total spend (₦)</Label>
              <Input
                type="number"
                value={editing.totalSpend ?? 0}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    totalSpend: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>Source</Label>
              <Select
                value={editing.source || "Walk-in"}
                onChange={(e) =>
                  setEditing({ ...editing, source: e.target.value })
                }
              >
                {CUSTOMER_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>Interests (gadget categories)</Label>
            <div className="flex flex-wrap gap-2">
              {GADGET_CATEGORIES.map((cat) => {
                const active = (editing.interests || []).includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleInterest(cat)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={
                Array.isArray(editing.tags)
                  ? editing.tags.join(", ")
                  : (editing.tags as unknown as string) || ""
              }
              onChange={(e) =>
                setEditing({
                  ...editing,
                  tags: e.target.value as unknown as string[],
                })
              }
              placeholder="VIP, repeat-buyer"
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
              {saving ? "Saving…" : "Save customer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
