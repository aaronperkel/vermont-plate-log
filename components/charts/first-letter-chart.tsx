'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/*
 * Sightings bucketed by first letter, across all 22 letters Vermont uses.
 *
 * All 22 are shown even when most are empty: the gaps are the information. A
 * chart of only the letters you have seen would hide how narrow the collection
 * is. One hue throughout — a colour per letter would imply a meaning the
 * letters do not carry.
 */
export type LetterBucket = { letter: string; count: number };

export function FirstLetterChart({ data }: { data: LetterBucket[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="letter"
            tick={{ fill: 'var(--ink-faint)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--axis)' }}
            interval={0}
          />
          <YAxis
            tick={{ fill: 'var(--ink-faint)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: 'var(--grid)' }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--rule-strong)',
              borderRadius: 2,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--ink-soft)' }}
            labelFormatter={(letter) => `Plates starting ${letter}`}
            formatter={(value) => [`${value}`, 'Spotted']}
          />
          <Bar dataKey="count" fill="var(--plate-green)" radius={[1, 1, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
