"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: UserStatus;
  trackingId: string | null;
  theme: string;
  locale: string;
  shipToCountry: string;
  aiProvider: string;
  hasAiKey: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: AdminUser[];
}

type Action = "approve" | "reject" | "assignTracking";

interface PatchResponse {
  user?: AdminUser;
  error?: string;
}

const STATUS_STYLES: Record<UserStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border border-amber-200",
  APPROVED: "bg-green-100 text-green-800 border border-green-200",
  REJECTED: "bg-red-100 text-red-700 border border-red-200",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

export function AdminClient() {
  const t = useTranslations();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("bad");
      const data = (await res.json()) as UsersResponse;
      setUsers(data.users || []);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const u of data.users || []) {
          if (next[u.id] === undefined) next[u.id] = u.trackingId || "";
        }
        return next;
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(id: string, action: Action) {
    setBusy(id);
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    const body: { action: Action; trackingId?: string } = { action };
    if (action === "assignTracking" || action === "approve") {
      body.trackingId = (drafts[id] || "").trim();
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as PatchResponse;
      if (data.error === "needs_tracking") {
        setRowErrors((prev) => ({ ...prev, [id]: t("admin.needsTracking") }));
        return;
      }
      if (!res.ok || data.error) {
        setRowErrors((prev) => ({ ...prev, [id]: t("common.error") }));
        return;
      }
      await load();
    } catch {
      setRowErrors((prev) => ({ ...prev, [id]: t("common.error") }));
    } finally {
      setBusy(null);
    }
  }

  const pending = users.filter((u) => u.status === "PENDING");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-lg font-semibold text-ink">{t("admin.title")}</h1>

      {loading ? (
        <p className="text-ink-muted">{t("common.loading")}</p>
      ) : error ? (
        <div className="card border border-red-200 bg-red-50 text-red-700 text-sm">
          {t("common.error")}
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-ink">{t("admin.pending")}</h2>
            {pending.length === 0 ? (
              <div className="card text-center text-ink-muted py-8">
                No pending approvals
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {pending.map((u) => (
                  <li key={u.id} className="card flex flex-col gap-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {u.name || u.email}
                        </p>
                        <p className="text-xs text-ink-muted truncate">{u.email}</p>
                      </div>
                      <span className="text-xs text-ink-muted">
                        {formatDate(u.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-end gap-2">
                      <label className="flex flex-col gap-1 text-xs text-ink-muted">
                        {t("admin.trackingId")}
                        <input
                          className="input text-sm"
                          value={drafts[u.id] ?? ""}
                          placeholder={t("admin.trackingId")}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))
                          }
                        />
                      </label>
                      <button
                        onClick={() => runAction(u.id, "assignTracking")}
                        disabled={busy === u.id}
                        className="rounded-full px-4 py-2 text-sm border border-line bg-surface text-ink hover:bg-surface-2 disabled:opacity-50"
                      >
                        {t("admin.assign")}
                      </button>
                      <button
                        onClick={() => runAction(u.id, "approve")}
                        disabled={busy === u.id}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {t("admin.approve")}
                      </button>
                      <button
                        onClick={() => runAction(u.id, "reject")}
                        disabled={busy === u.id}
                        className="rounded-full px-4 py-2 text-sm border border-red-200 text-red-700 bg-surface hover:bg-red-50 disabled:opacity-50"
                      >
                        {t("admin.reject")}
                      </button>
                    </div>

                    {rowErrors[u.id] && (
                      <p className="text-xs text-red-700">{rowErrors[u.id]}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-ink">{t("admin.users")}</h2>
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ink-muted">
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    <th className="px-3 py-2 font-medium">{t("admin.trackingId")}</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 text-ink">
                        <span className="block truncate max-w-[220px]">{u.email}</span>
                        {u.name && (
                          <span className="block text-xs text-ink-muted truncate max-w-[220px]">
                            {u.name}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[u.status]}`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-ink-muted">{u.role}</td>
                      <td className="px-3 py-2 text-ink-muted">
                        {u.trackingId || "—"}
                      </td>
                      <td className="px-3 py-2 text-ink-muted whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
