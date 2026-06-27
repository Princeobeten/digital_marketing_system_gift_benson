"use client";

import { useCallback, useEffect, useState } from "react";
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
import type { Segment, SegmentRule } from "@/lib/types";
import {
  CUSTOMER_SOURCES,
  GADGET_CATEGORIES,
  SEGMENT_FIELDS,
  SEGMENT_OPERATORS,
  formatNaira,
} from "@/lib/constants";

type SegmentWithCount = Segment & { matchCount?: number };

interface PreviewCustomer {
  _id: string;
  name: string;
  email: string;
  location?: string;
  interests: string[];
  totalSpend: number;
}

const NEW_RULE: SegmentRule = {
  field: "interests",
  operator: "eq",
  value: GADGET_CATEGORIES[0],
};

export default function SegmentsPage() {
  const [segments, setSegments] = useState<SegmentWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<SegmentWithCount>>({});
  const [rules, setRules] = useState<SegmentRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [preview, setPreview] = useState<{
    count: number;
    sample: PreviewCustomer[];
  }>({ count: 0, sample: [] });

  async function load() {
    setLoading(true);
    try {
      const { segments } = await api.get<{ segments: SegmentWithCount[] }>(
        "/api/segments"
      );
      setSegments(segments);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const runPreview = useCallback(async (currentRules: SegmentRule[]) => {
    try {
      const data = await api.post<{ count: number; sample: PreviewCustomer[] }>(
        "/api/segments/preview",
        { rules: currentRules }
      );
      setPreview(data);
    } catch {
      setPreview({ count: 0, sample: [] });
    }
  }, []);

  // Debounced live preview whenever rules change while the modal is open.
  useEffect(() => {
    if (!modalOpen) return;
    const t = setTimeout(() => runPreview(rules), 350);
    return () => clearTimeout(t);
  }, [rules, modalOpen, runPreview]);

  function openCreate() {
    setEditing({ name: "", description: "" });
    setRules([{ ...NEW_RULE }]);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(s: SegmentWithCount) {
    setEditing({ ...s });
    setRules(s.rules.length ? s.rules.map((r) => ({ ...r })) : [{ ...NEW_RULE }]);
    setFormError("");
    setModalOpen(true);
  }

  function fieldType(field: string) {
    return SEGMENT_FIELDS.find((f) => f.value === field)?.type ?? "text";
  }

  function updateRule(index: number, patch: Partial<SegmentRule>) {
    setRules((rs) =>
      rs.map((r, i) => {
        if (i !== index) return r;
        const next = { ...r, ...patch };
        // When switching field, reset value to a sensible default for its type.
        if (patch.field) {
          const type = fieldType(patch.field);
          next.value =
            type === "category"
              ? GADGET_CATEGORIES[0]
              : type === "source"
              ? CUSTOMER_SOURCES[0]
              : type === "number"
              ? 0
              : "";
        }
        return next;
      })
    );
  }

  function addRule() {
    setRules((rs) => [...rs, { ...NEW_RULE }]);
  }

  function removeRule(index: number) {
    setRules((rs) => rs.filter((_, i) => i !== index));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const payload = {
      name: editing.name,
      description: editing.description,
      rules,
    };
    try {
      if (editing._id) {
        await api.put(`/api/segments/${editing._id}`, payload);
      } else {
        await api.post("/api/segments", payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: SegmentWithCount) {
    if (!confirm(`Delete segment "${s.name}"?`)) return;
    await api.del(`/api/segments/${s._id}`);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Segments"
        subtitle="Group customers by interests, location, spend and more — then target them with campaigns."
        action={<Button onClick={openCreate}>+ New segment</Button>}
      />

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : segments.length === 0 ? (
        <EmptyState
          title="No segments yet"
          description="Create a segment to target specific groups of customers."
          action={<Button onClick={openCreate}>+ New segment</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {segments.map((s) => (
            <Card key={s._id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  {s.description && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {s.description}
                    </p>
                  )}
                </div>
                <Badge color="green">{s.matchCount ?? 0} customers</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.rules.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                  >
                    {ruleLabel(r)}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => remove(s)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing._id ? "Edit segment" : "New segment"}
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Segment name</Label>
            <Input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="e.g. Lagos smartphone buyers"
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={editing.description || ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Rules (all must match)</Label>
            <div className="space-y-2">
              {rules.map((rule, i) => {
                const type = fieldType(rule.field);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={rule.field}
                      onChange={(e) =>
                        updateRule(i, { field: e.target.value })
                      }
                      className="flex-1"
                    >
                      {SEGMENT_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={rule.operator}
                      onChange={(e) =>
                        updateRule(i, { operator: e.target.value })
                      }
                      className="w-36"
                    >
                      {SEGMENT_OPERATORS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                    {type === "category" ? (
                      <Select
                        value={String(rule.value)}
                        onChange={(e) =>
                          updateRule(i, { value: e.target.value })
                        }
                        className="flex-1"
                      >
                        {GADGET_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    ) : type === "source" ? (
                      <Select
                        value={String(rule.value)}
                        onChange={(e) =>
                          updateRule(i, { value: e.target.value })
                        }
                        className="flex-1"
                      >
                        {CUSTOMER_SOURCES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        type={type === "number" ? "number" : "text"}
                        value={rule.value}
                        onChange={(e) =>
                          updateRule(i, {
                            value:
                              type === "number"
                                ? Number(e.target.value)
                                : e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeRule(i)}
                      className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                      aria-label="Remove rule"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={addRule}
            >
              + Add rule
            </Button>
          </div>

          <div className="rounded-lg bg-indigo-50 px-4 py-3">
            <p className="text-sm font-medium text-indigo-900">
              {preview.count} matching customer
              {preview.count === 1 ? "" : "s"}
            </p>
            {preview.sample.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {preview.sample.map((c) => (
                  <span
                    key={c._id}
                    className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600"
                    title={`${c.email} · ${formatNaira(c.totalSpend)}`}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
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
              {saving ? "Saving…" : "Save segment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ruleLabel(r: SegmentRule): string {
  const field = SEGMENT_FIELDS.find((f) => f.value === r.field)?.label ?? r.field;
  const op = SEGMENT_OPERATORS.find((o) => o.value === r.operator)?.label ?? r.operator;
  return `${field} ${op} ${r.value}`;
}
