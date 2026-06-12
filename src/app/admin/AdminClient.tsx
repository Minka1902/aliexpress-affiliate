"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSeedMode } from "@/components/SeedModeProvider";
import { seedAdminUsers, seedAdminOrders, seedUserStats } from "@/lib/seed-fixtures";
import { Icon } from "@/components/Icon";

type Role = "USER" | "FAMILY" | "PARTNERS_FAMILY" | "FRIENDS" | "PARTNERS_FRIENDS" | "ADMIN";
type Status = "ACTIVE" | "BANNED";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: Status;
  trackingId: string | null;
  unlockedAi: boolean;
  unlockedCart: boolean;
  unlockedWishlist: boolean;
  createdAt: string;
}

interface Config {
  priceAi: number;
  priceCart: number;
  priceWishlist: number;
  priceBundle: number;
  bundleEnabled: boolean;
  currency: string;
  defaultTrackingId: string | null;
}

interface AdminOrder {
  orderId: string;
  status?: string;
  productTitle?: string;
  orderValue?: string;
  currency?: string;
  createdAt?: string;
  category?: string;
  commission?: string | null;
}

const ROLES: Role[] = ["USER", "FAMILY", "PARTNERS_FAMILY", "FRIENDS", "PARTNERS_FRIENDS", "ADMIN"];
type Tab = "users" | "orders" | "pricing";

export function AdminClient() {
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">{t("admin.title")}</h1>
      <div className="flex gap-2 border-b border-line">
        {(["users", "orders", "pricing"] as Tab[]).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === tb ? "border-brand text-brand" : "border-transparent text-ink-muted"
            }`}
          >
            {tb === "users" ? t("admin.users") : tb === "orders" ? t("admin.allOrders") : t("admin.pricing")}
          </button>
        ))}
      </div>
      {tab === "users" && <UsersTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "pricing" && <PricingTab />}
    </div>
  );
}

/* ------------------------------ Users ------------------------------ */
function UsersTab() {
  const t = useTranslations();
  const { seedMode } = useSeedMode();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const load = useCallback(
    async (query: string) => {
      if (seedMode) {
        const all = seedAdminUsers() as AdminUser[];
        const ql = query.toLowerCase();
        setUsers(
          ql ? all.filter((u) => u.email.includes(ql) || (u.name ?? "").toLowerCase().includes(ql)) : all
        );
        return;
      }
      const res = await fetch(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      if (res.ok) setUsers((await res.json()).users);
    },
    [seedMode]
  );

  useEffect(() => {
    const id = setTimeout(() => load(q), 250);
    return () => clearTimeout(id);
  }, [q, load]);

  return (
    <div className="flex flex-col gap-4">
      <input
        className="input max-w-sm"
        placeholder={t("admin.search")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-ink-muted border-b border-line">
              <th className="py-2 px-3 font-medium">Email</th>
              <th className="py-2 px-3 font-medium">Name</th>
              <th className="py-2 px-3 font-medium">Role</th>
              <th className="py-2 px-3 font-medium">Status</th>
              <th className="py-2 px-3 font-medium">Tracking ID</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                onClick={() => setSelected(u)}
                className="border-b border-line last:border-0 cursor-pointer hover:bg-surface-2"
              >
                <td className="py-2 px-3 text-brand">{u.email}</td>
                <td className="py-2 px-3 text-ink">{u.name || "—"}</td>
                <td className="py-2 px-3 text-ink-muted">{t(`roles.${u.role}`)}</td>
                <td className="py-2 px-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      u.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="py-2 px-3 text-ink-muted font-mono text-xs">{u.trackingId || "—"}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-ink-muted">
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selected && (
        <UserPopup
          user={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            load(q);
          }}
        />
      )}
    </div>
  );
}

interface Stats {
  linkCount: number;
  orderCount: number;
  gmv: string;
  commission: string;
  currency: string;
}

function UserPopup({
  user,
  onClose,
  onChanged,
}: {
  user: AdminUser;
  onClose: () => void;
  onChanged: () => void;
}) {
  const t = useTranslations();
  const { seedMode } = useSeedMode();
  const [form, setForm] = useState<AdminUser>(user);
  const [stats, setStats] = useState<Stats | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (seedMode) {
      setStats(seedUserStats(user.id.length));
      return;
    }
    fetch(`/api/admin/users/${user.id}/stats`)
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => {});
  }, [user.id, seedMode]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) onChanged();
  }

  async function del() {
    if (!confirm(t("admin.confirmDelete"))) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) onChanged();
  }

  function set<K extends keyof AdminUser>(k: K, v: AdminUser[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{user.email}</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink" aria-label="close">
            <Icon name="close" size={18} />
          </button>
        </div>

        <p className="text-xs text-ink-muted">
          {t("admin.joined")}: {new Date(user.createdAt).toLocaleDateString()}
        </p>

        {/* Statistics (admin-only, includes commission) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Links" value={stats ? String(stats.linkCount) : "…"} />
          <Stat label="Orders" value={stats ? String(stats.orderCount) : "…"} />
          <Stat label="GMV" value={stats ? `${stats.currency} ${stats.gmv}` : "…"} />
          <Stat label={t("admin.commission")} value={stats ? `${stats.currency} ${stats.commission}` : "…"} />
        </div>

        {/* Editable fields */}
        <label className="text-sm text-ink-muted">
          Name
          <input className="input mt-1" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="text-sm text-ink-muted">
          Email
          <input className="input mt-1" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label className="text-sm text-ink-muted">
          {t("admin.trackingId")}
          <input
            className="input mt-1 font-mono"
            value={form.trackingId ?? ""}
            onChange={(e) => set("trackingId", e.target.value)}
          />
        </label>
        <label className="text-sm text-ink-muted">
          Role
          <select className="input mt-1" value={form.role} onChange={(e) => set("role", e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-3 text-sm">
          {(["unlockedAi", "unlockedCart", "unlockedWishlist"] as const).map((k) => (
            <label key={k} className="flex items-center gap-1 text-ink">
              <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} />
              {k.replace("unlocked", "")}
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
          <button
            disabled={saving}
            onClick={() =>
              patch({
                name: form.name,
                email: form.email,
                role: form.role,
                trackingId: form.trackingId || null,
                unlockedAi: form.unlockedAi,
                unlockedCart: form.unlockedCart,
                unlockedWishlist: form.unlockedWishlist,
              })
            }
            className="btn-primary"
          >
            {t("admin.save")}
          </button>
          {form.status === "ACTIVE" ? (
            <button
              onClick={() => patch({ status: "BANNED" })}
              className="rounded-full px-4 py-2 text-sm border border-line text-ink hover:bg-surface-2"
            >
              {t("admin.ban")}
            </button>
          ) : (
            <button
              onClick={() => patch({ status: "ACTIVE" })}
              className="rounded-full px-4 py-2 text-sm border border-line text-ink hover:bg-surface-2"
            >
              {t("admin.unban")}
            </button>
          )}
          <button onClick={del} className="rounded-full px-4 py-2 text-sm bg-red-600 text-white hover:opacity-90">
            {t("admin.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-2 rounded p-2">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

/* ------------------------------ Orders ------------------------------ */
function OrdersTab() {
  const { seedMode } = useSeedMode();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<{ count: number; gmv: string; commission: string; currency: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (seedMode) {
      const s = seedAdminOrders();
      setOrders(s.orders);
      setSummary(s.summary);
      setLoading(false);
      return;
    }
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setSummary(d.summary || null);
      })
      .finally(() => setLoading(false));
  }, [seedMode]);

  if (loading) return <div className="skeleton h-64 rounded-card" />;

  return (
    <div className="flex flex-col gap-4">
      {summary && (
        <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
          <Stat label="Orders" value={String(summary.count)} />
          <Stat label="GMV" value={`${summary.currency} ${summary.gmv}`} />
          <Stat label="Commission" value={`${summary.currency} ${summary.commission}`} />
        </div>
      )}
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-ink-muted border-b border-line">
              <th className="py-2 px-3 font-medium">Product</th>
              <th className="py-2 px-3 font-medium">Status</th>
              <th className="py-2 px-3 font-medium">Value</th>
              <th className="py-2 px-3 font-medium">Commission</th>
              <th className="py-2 px-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.orderId} className="border-b border-line last:border-0">
                <td className="py-2 px-3 text-ink max-w-xs">
                  <span className="line-clamp-2">{o.productTitle || o.orderId}</span>
                </td>
                <td className="py-2 px-3 text-ink-muted">{o.status || "—"}</td>
                <td className="py-2 px-3 text-price">
                  {o.currency} {o.orderValue || "—"}
                </td>
                <td className="py-2 px-3 text-ink-muted">{o.commission ?? "—"}</td>
                <td className="py-2 px-3 text-ink-muted">{o.createdAt || "—"}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-ink-muted">
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ Pricing ------------------------------ */
function PricingTab() {
  const t = useTranslations();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((d) => setCfg(d.config));
  }, []);

  if (!cfg) return <div className="skeleton h-48 rounded-card" />;

  function set<K extends keyof Config>(k: K, v: Config[K]) {
    setCfg((c) => (c ? { ...c, [k]: v } : c));
  }

  async function save() {
    if (!cfg) return;
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceAi: cfg.priceAi,
        priceCart: cfg.priceCart,
        priceWishlist: cfg.priceWishlist,
        priceBundle: cfg.priceBundle,
        bundleEnabled: cfg.bundleEnabled,
        currency: cfg.currency,
        defaultTrackingId: cfg.defaultTrackingId || null,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  const num = (k: "priceAi" | "priceCart" | "priceWishlist" | "priceBundle", label: string) => (
    <label className="text-sm text-ink-muted">
      {label} ({cfg.currency}, minor units)
      <input
        type="number"
        className="input mt-1"
        value={cfg[k]}
        onChange={(e) => set(k, Number(e.target.value))}
      />
    </label>
  );

  return (
    <div className="card max-w-md flex flex-col gap-3">
      {num("priceAi", t("pay.featureAi"))}
      {num("priceCart", t("pay.featureCart"))}
      {num("priceWishlist", t("pay.featureWishlist"))}
      {num("priceBundle", t("pay.bundle"))}
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={cfg.bundleEnabled} onChange={(e) => set("bundleEnabled", e.target.checked)} />
        Bundle enabled
      </label>
      <label className="text-sm text-ink-muted">
        Currency
        <input className="input mt-1" value={cfg.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
      </label>
      <label className="text-sm text-ink-muted">
        Default tracking ID (USER role)
        <input
          className="input mt-1 font-mono"
          value={cfg.defaultTrackingId ?? ""}
          onChange={(e) => set("defaultTrackingId", e.target.value)}
        />
      </label>
      <button onClick={save} className="btn-primary self-start">
        {saved ? "✓" : t("admin.save")}
      </button>
    </div>
  );
}
