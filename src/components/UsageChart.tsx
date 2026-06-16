import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsApi } from '../api/analyticsApi';
import { formatDuration, getFaviconUrl } from '../lib/formatters';
import { cn } from '../lib/utils';

interface UsageChartProps {
  childId: number;
  childName: string;
}

const PIE_COLORS = [
  'var(--brand)',
  'var(--success)',
  'var(--warning)',
  'var(--error)',
  'var(--brand-hover)',
];

function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}`;
}

export default function UsageChart({ childId, childName }: UsageChartProps) {
  const { data: weeklyUsage, isLoading: weeklyLoading } = useQuery({
    queryKey: ['analytics-weekly', childId],
    queryFn: () => analyticsApi.getWeeklyUsage(childId),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const { data: topDomains, isLoading: topDomainsLoading } = useQuery({
    queryKey: ['analytics-top-domains', childId],
    queryFn: () => analyticsApi.getTopDomains(childId),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const weeklyData = (weeklyUsage ?? []).map((item) => ({
    date: formatShortDate(item.date),
    totalSeconds: item.totalSeconds,
  }));

  const pieData = (topDomains ?? []).map((item) => ({
    name: item.domain,
    value: item.totalSeconds,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tx-muted">Analytics</p>
          <h3 className="text-2xl font-black tracking-tight text-tx-primary">
            Hoạt động của {childName}
          </h3>
        </div>
        <p className="text-xs font-medium text-tx-secondary">
          7 ngày gần nhất và top domain 30 ngày
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-border-base bg-bg-surface p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tx-muted">Biểu đồ cột</p>
            <h4 className="mt-1 text-lg font-bold text-tx-primary">Tổng thời gian online theo ngày</h4>
          </div>

          {weeklyLoading ? (
            <div className="flex h-[280px] items-center justify-center text-sm font-medium text-tx-secondary">
              Đang tải...
            </div>
          ) : weeklyData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm font-medium text-tx-secondary">
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => formatDuration(Number(value))}
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatDuration(Number(value ?? 0)), 'Thời gian']}
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-base)',
                      borderRadius: '16px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      boxShadow: 'var(--shadow-md)',
                    }}
                    cursor={{ fill: 'var(--bg-subtle)' }}
                  />
                  <Bar dataKey="totalSeconds" fill="var(--brand)" radius={[12, 12, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-border-base bg-bg-surface p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tx-muted">Biểu đồ tròn</p>
            <h4 className="mt-1 text-lg font-bold text-tx-primary">Top 5 domain truy cập nhiều nhất</h4>
          </div>

          {topDomainsLoading ? (
            <div className="flex h-[280px] items-center justify-center text-sm font-medium text-tx-secondary">
              Đang tải...
            </div>
          ) : pieData.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm font-medium text-tx-secondary">
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={92}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [formatDuration(Number(value ?? 0)), 'Thời gian']}
                      contentStyle={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-base)',
                        borderRadius: '16px',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col justify-center gap-3">
                {pieData.map((item, index) => (
                  <div
                    key={item.name}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border border-border-base bg-bg-subtle/30 px-3 py-2',
                      index === 0 && 'ring-1 ring-brand/20',
                    )}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <img
                      src={getFaviconUrl(item.name)}
                      alt=""
                      className="h-4 w-4 shrink-0 rounded"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-tx-primary">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-tx-secondary">
                      {formatDuration(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
