"use client";

import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const BRAND = "rgb(230,46,4)";
const PIE_PALETTE = [
  "rgb(230,46,4)",
  "rgb(255,146,43)",
  "rgb(255,196,0)",
  "rgb(46,160,67)",
  "rgb(31,111,235)",
  "rgb(130,80,223)",
];

export interface ChartData {
  categoryData: { name: string; value: number }[];
  statusData: { name: string; value: number }[];
  overTimeData: { date: string; value: number }[];
}

// Heavy (recharts) — loaded lazily by Dashboard via next/dynamic so it doesn't block the
// initial interactive render.
export default function DashboardCharts({ categoryData, statusData, overTimeData }: ChartData) {
  const t = useTranslations();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card">
        <h2 className="text-sm font-semibold text-ink mb-3">{t("dashboard.byCategory")}</h2>
        {categoryData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-ink-muted text-sm">—</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill={BRAND} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-ink mb-3">{t("dashboard.byStatus")}</h2>
        {statusData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-ink-muted text-sm">—</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {statusData.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card lg:col-span-2">
        <h2 className="text-sm font-semibold text-ink mb-3">{t("dashboard.overTime")}</h2>
        {overTimeData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-ink-muted text-sm">—</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={overTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
