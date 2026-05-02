import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { logsApi } from '../../api/logs.api';
import { formatDuration } from '../../lib/formatters';

interface Props {
  childId: number;
}

export function UsageSummaryTab({ childId }: Props) {
  const [days, setDays] = useState(7);

  const { data, isLoading } = useQuery({
    queryKey: ['usage-summary', childId, days],
    queryFn: () => logsApi.getSummary(childId, days).then(r => r.data),
    refetchInterval: 60_000, // refresh mỗi phút
  });

  if (isLoading) return <UsageSkeleton />;

  return (
    <div className="space-y-6 p-4">
      {/* ── Bộ chọn khoảng thời gian ── */}
      <div className="flex gap-2">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              days === d
                ? 'bg-violet-600 text-white'
                : 'bg-bg-subtle text-tx-secondary hover:bg-bg-muted'
            }`}
          >
            {d} ngày
          </button>
        ))}
      </div>

      {/* ── Chart: Tổng thời gian theo domain (Horizontal Bar) ── */}
      <div className="bg-bg-surface rounded-[2.5rem] border border-border-base shadow-sm p-8">
        <h3 className="text-xl font-bold text-tx-primary mb-6 flex items-center gap-2">
          <span>⏱️</span> Thời gian theo website ({days} ngày)
        </h3>

        {data?.byDomain.length === 0 ? (
          <p className="text-tx-muted text-sm text-center py-12 font-medium">Chưa có dữ liệu</p>
        ) : (
          <div style={{ height: Math.max(300, (data?.byDomain.length ?? 0) * 60) }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                data={data?.byDomain.map(d => ({
                    name: d.displayName || d.domain,
                    faviconUrl: d.faviconUrl,
                    totalSeconds: d.totalSeconds,
                    limitSeconds: d.timeLimitMinutes ? d.timeLimitMinutes * 60 * days : null,
                    overLimit: d.timeLimitMinutes
                    ? d.totalSeconds > d.timeLimitMinutes * 60 * days
                    : false,
                }))}
                layout="vertical"
                margin={{ left: 20, right: 40, top: 5, bottom: 5 }}
                >
                <XAxis
                    type="number"
                    tickFormatter={(v) => formatDuration(v)}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: 'var(--text-primary)', fontWeight: 700 }}
                    width={120}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip
                    cursor={{ fill: 'var(--bg-subtle)' }}
                    formatter={(value: any, _: any, props: any) => [
                    formatDuration(Number(value)),
                    props.payload.overLimit ? '⚠️ Vượt giới hạn' : '✅ Bình thường',
                    ]}
                    contentStyle={{
                      color: 'var(--text-muted)',
                      
                    borderRadius: '20px',
                    border: 'none',
                    boxShadow: 'var(--shadow-md)',
                    padding: '12px 16px',
                    fontWeight: 'bold',
                    }}
                />
                <Bar dataKey="totalSeconds" radius={[0, 10, 10, 0]} barSize={24}>
                    {data?.byDomain.map((entry, index) => (
                    <Cell
                        key={index}
                        fill={
                        entry.timeLimitMinutes &&
                        entry.totalSeconds > entry.timeLimitMinutes * 60 * days
                            ? '#ef4444'   // đỏ nếu vượt giới hạn
                            : '#7c3aed'  // tím bình thường
                        }
                    />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Chart: Tổng thời gian theo ngày (Line Chart) ── */}
      <div className="bg-bg-surface rounded-[2.5rem] border border-border-base shadow-sm p-8">
        <h3 className="text-xl font-bold text-tx-primary mb-6 flex items-center gap-2">
          <span>📅</span> Hoạt động theo ngày
        </h3>
        <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.byDay.map(d => ({
                date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                hours: Math.round(d.totalSeconds / 360) / 10, // 1 decimal
            }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis
                tickFormatter={(v) => `${v}h`}
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                />
                <Tooltip
                formatter={(v: any) => [`${v} giờ`, 'Tổng thời gian']}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: 'var(--shadow-md)',color: 'var(--text-muted)', padding: '12px 16px', fontWeight: 'bold' }}
                />
                <Line
                type="monotone"
                dataKey="hours"
                stroke="#7c3aed"
                strokeWidth={4}
                dot={{ fill: '#7c3aed', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                />
            </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bảng chi tiết theo domain ── */}
      <div className="bg-bg-surface rounded-[2.5rem] border border-border-base shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-border-base">
          <h3 className="text-lg font-bold text-tx-primary uppercase tracking-widest text-[13px]">📊 Chi tiết theo website</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="bg-bg-subtle">
                <tr>
                <th className="text-left px-8 py-4 text-tx-muted font-bold uppercase tracking-widest text-[10px]">Website</th>
                <th className="text-right px-8 py-4 text-tx-muted font-bold uppercase tracking-widest text-[10px]">Tổng thời gian</th>
                <th className="text-right px-8 py-4 text-tx-muted font-bold uppercase tracking-widest text-[10px]">Giới hạn/ngày</th>
                <th className="text-right px-8 py-4 text-tx-muted font-bold uppercase tracking-widest text-[10px]">Lượt truy cập</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
                {data?.byDomain.map((d) => (
                <tr key={d.domain} className="hover:bg-bg-subtle/50 transition-colors group">
                    <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                        {d.faviconUrl ? (
                        <img src={d.faviconUrl} alt="" className="w-8 h-8 rounded-xl shadow-sm bg-bg-surface" />
                        ) : (
                            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-400 text-xs font-bold uppercase">
                                {d.domain.charAt(0)}
                            </div>
                        )}
                        <div>
                        <div className="font-bold text-tx-primary">
                            {d.displayName || d.domain}
                        </div>
                        <div className="text-[10px] text-tx-muted font-bold uppercase tracking-tighter">{d.domain}</div>
                        </div>
                    </div>
                    </td>
                    <td className="px-8 py-4 text-right font-black text-tx-primary font-mono">
                    {formatDuration(d.totalSeconds)}
                    </td>
                    <td className="px-8 py-4 text-right text-tx-secondary font-bold text-xs">
                    {d.timeLimitMinutes
                        ? `${d.timeLimitMinutes} phút/ngày`
                        : <span className="text-gray-300 font-normal">—</span>}
                    </td>
                    <td className="px-8 py-4 text-right text-tx-secondary font-black font-mono">
                    {d.totalRequests.toLocaleString()}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

function UsageSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex gap-2">
        {[1, 2, 3].map(i => <div key={i} className="h-9 w-20 bg-bg-subtle rounded-full animate-pulse" />)}
      </div>
      {[300, 250, 400].map((h, i) => (
        <div key={i} className="bg-bg-subtle rounded-[2.5rem] animate-pulse" style={{ height: h }} />
      ))}
    </div>
  );
}
