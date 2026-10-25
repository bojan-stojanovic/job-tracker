"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function FunnelChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <>
      {/* currentColor follows the text color, so the bars flip with the theme. */}
      <div className="h-72 w-full text-neutral-900">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-neutral-300)" />
            <XAxis dataKey="name" stroke="var(--color-neutral-500)" tick={{ fill: "var(--color-neutral-600)" }} />
            <YAxis allowDecimals={false} stroke="var(--color-neutral-500)" tick={{ fill: "var(--color-neutral-600)" }} />
            <Tooltip
              cursor={{ fill: "var(--color-neutral-200)" }}
              contentStyle={{
                backgroundColor: "var(--color-white)",
                border: "1px solid var(--color-neutral-300)",
                color: "var(--color-neutral-900)",
              }}
            />
            <Bar dataKey="count" fill="currentColor" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">
        {data.map((d) => (
          <li key={d.name}>
            {d.name}: {d.count}
          </li>
        ))}
      </ul>
    </>
  );
}