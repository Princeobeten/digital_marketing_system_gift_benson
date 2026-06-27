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
  Textarea,
} from "@/components/ui";
import { api } from "@/lib/fetcher";
import type { Product } from "@/lib/types";
import { GADGET_CATEGORIES, formatNaira } from "@/lib/constants";

const EMPTY: Partial<Product> = {
  name: "",
  category: GADGET_CATEGORIES[0],
  brand: "",
  price: 0,
  stock: 0,
  description: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Product>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load(q = "") {
    setLoading(true);
    try {
      const { products } = await api.get<{ products: Product[] }>(
        `/api/products${q ? `?q=${encodeURIComponent(q)}` : ""}`
      );
      setProducts(products);
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

  function openEdit(p: Product) {
    setEditing({ ...p });
    setFormError("");
    setModalOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const payload = {
      name: editing.name,
      category: editing.category,
      brand: editing.brand,
      price: Number(editing.price) || 0,
      stock: Number(editing.stock) || 0,
      description: editing.description,
    };
    try {
      if (editing._id) {
        await api.put(`/api/products/${editing._id}`, payload);
      } else {
        await api.post("/api/products", payload);
      }
      setModalOpen(false);
      load(query);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Delete ${p.name}?`)) return;
    await api.del(`/api/products/${p._id}`);
    load(query);
  }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="The gadget catalog you promote through campaigns."
        action={<Button onClick={openCreate}>+ Add product</Button>}
      />

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search products…"
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
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add gadgets to your catalog or run the seed script."
          action={<Button onClick={openCreate}>+ Add product</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p._id} className="flex flex-col p-4">
              <div className="mb-2 flex items-start justify-between">
                <Badge color="indigo">{p.category}</Badge>
                <Badge color={p.stock > 0 ? "green" : "red"}>
                  {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                </Badge>
              </div>
              <h3 className="font-semibold text-slate-900">{p.name}</h3>
              <p className="text-xs text-slate-400">{p.brand}</p>
              {p.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                  {p.description}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-3">
                <span className="text-lg font-bold text-slate-900">
                  {formatNaira(p.price)}
                </span>
                <div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => remove(p)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing._id ? "Edit product" : "Add product"}
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              >
                {GADGET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Brand</Label>
              <Input
                value={editing.brand || ""}
                onChange={(e) =>
                  setEditing({ ...editing, brand: e.target.value })
                }
                placeholder="e.g. Apple"
              />
            </div>
            <div>
              <Label>Price (₦)</Label>
              <Input
                type="number"
                value={editing.price ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, price: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <Label>Stock</Label>
              <Input
                type="number"
                value={editing.stock ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, stock: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={editing.description || ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
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
              {saving ? "Saving…" : "Save product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
