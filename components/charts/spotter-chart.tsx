'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/*
 * Aaron against Riley, by count. One hue, because this is a magnitude
 * comparison — a colour each would imply the two are different in kind.
 */
export type SpotterCount = { name: string; count: number };

export function SpotterChart({ data }: { data: SpotterCount[] }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'var(--ink-faint)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--axis)' }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'var(--ink-soft)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: 'var(--grid)' }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--rule-strong)',
              borderRadius: 2,
              fontSize: 12,
            }}
            formatter={(value) => [`${value}`, 'Plates logged']}
          />
          <Bar dataKey="count" fill="var(--plate-green)" radius={[0, 1, 1, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
