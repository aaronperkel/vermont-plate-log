'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/*
 * Where the collection sits along the sequence, as a running total.
 *
 * The x axis is fixed to the confirmed anchors plus a little headroom rather
 * than to the data, so the chart has scale on day one and a first sighting
 * appears in its true position instead of filling the frame. This is the job
 * the seeded anchor rows were meant to do; reference lines do it without
 * putting plates nobody spotted into the collection.
 */
export type CoveragePoint = { ordinal: number; total: number };
export type AnchorLine = { ordinal: number; label: string };

export function CoverageChart({
  data,
  anchors,
  domain,
}: {
  data: CoveragePoint[];
  anchors: AnchorLine[];
  domain: [number, number];
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="ordinal"
            type="number"
            domain={domain}
            tick={{ fill: 'var(--ink-faint)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--axis)' }}
            tickFormatter={(value: number) => `${(value / 1_000_000).toFixed(1)}M`}
          />
          <YAxis
            tick={{ fill: 'var(--ink-faint)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: 'var(--axis)', strokeWidth: 1 }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--rule-strong)',
              borderRadius: 2,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--ink-soft)' }}
            labelFormatter={(value) => `Sequence position ${Math.round(Number(value)).toLocaleString()}`}
            formatter={(value) => [`${value}`, 'Plates logged by here']}
          />
          {anchors.map((anchor, i) => (
            <ReferenceLine
              key={anchor.label}
              x={anchor.ordinal}
              stroke="var(--ink-faint)"
              strokeDasharray="3 3"
              label={{
                value: anchor.label,
                position: 'top',
                fill: 'var(--ink-faint)',
                fontSize: 10,
                // Alternating offset: the anchors cluster at the right-hand end
                // of the axis and their labels would otherwise sit on top of
                // each other.
                dy: i % 2 === 0 ? -2 : 10,
              }}
            />
          ))}
          <Area
            type="stepAfter"
            dataKey="total"
            stroke="var(--plate-green)"
            strokeWidth={2}
            fill="var(--plate-green)"
            fillOpacity={0.12}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
