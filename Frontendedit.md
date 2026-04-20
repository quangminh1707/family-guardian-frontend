# FRONTEND ADDITIONS
## Chỉ thêm phần hiển thị thời gian sử dụng — KHÔNG làm lại phần đã có

---

## A. TYPE MỚI CẦN THÊM (types/log.types.ts)

```typescript
// Thêm vào file types/log.types.ts hiện có

export interface WebSession {
  id: number;
  domain: string;
  displayName?: string;
  faviconUrl?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  isActive: boolean;  // true nếu đang mở (endedAt = null)
}

export interface SessionsResponse {
  items: WebSession[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface DomainSummary {
  domain: string;
  displayName?: string;
  faviconUrl?: string;
  timeLimitMinutes?: number;
  totalSeconds: number;
  totalRequests: number;
}

export interface DaySummary {
  date: string;   // "2025-01-01"
  totalSeconds: number;
}

export interface UsageSummary {
  byDomain: DomainSummary[];
  byDay: DaySummary[];
  days: number;
}
```

---

## B. API FUNCTION MỚI (api/logs.api.ts)

```typescript
// Thêm vào logsApi object hiện có:

getSessions: (childId: number, params?: {
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}) => api.get<SessionsResponse>(`/children/${childId}/logs/sessions`, { params }),

getSummary: (childId: number, days: number = 7) =>
  api.get<UsageSummary>(`/children/${childId}/logs/summary`, { params: { days } }),
```

---

## C. COMPONENT MỚI: UsageSummaryTab.tsx

Đây là tab "Thống kê" trong `ChildDetailPage` — hiển thị thời gian sử dụng.

```typescript
// components/logs/UsageSummaryTab.tsx

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LineChart, Line, CartesianGrid, Legend } from 'recharts';
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
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d} ngày
          </button>
        ))}
      </div>

      {/* ── Chart: Tổng thời gian theo domain (Horizontal Bar) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">
          ⏱️ Thời gian theo website ({days} ngày)
        </h3>

        {data?.byDomain.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, (data?.byDomain.length ?? 0) * 50)}>
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
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#374151' }}
                width={100}
              />
              <Tooltip
                formatter={(value: number, _, props) => [
                  formatDuration(value),
                  props.payload.overLimit ? '⚠️ Vượt giới hạn' : '✅ Bình thường',
                ]}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="totalSeconds" radius={[0, 6, 6, 0]}>
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
        )}
      </div>

      {/* ── Chart: Tổng thời gian theo ngày (Line Chart) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">
          📅 Hoạt động theo ngày
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data?.byDay.map(d => ({
            date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            hours: Math.round(d.totalSeconds / 360) / 10, // 1 decimal
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis
              tickFormatter={(v) => `${v}h`}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <Tooltip
              formatter={(v: number) => [`${v} giờ`, 'Tổng thời gian']}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ fill: '#7c3aed', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bảng chi tiết theo domain ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">📊 Chi tiết theo website</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Website</th>
              <th className="text-right px-5 py-3 text-gray-500 font-medium">Tổng thời gian</th>
              <th className="text-right px-5 py-3 text-gray-500 font-medium">Giới hạn/ngày</th>
              <th className="text-right px-5 py-3 text-gray-500 font-medium">Lượt truy cập</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.byDomain.map((d) => (
              <tr key={d.domain} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {d.faviconUrl && (
                      <img src={d.faviconUrl} alt="" className="w-5 h-5 rounded" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {d.displayName || d.domain}
                      </div>
                      <div className="text-xs text-gray-400">{d.domain}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-right font-mono text-gray-700">
                  {formatDuration(d.totalSeconds)}
                </td>
                <td className="px-5 py-3 text-right text-gray-500">
                  {d.timeLimitMinutes
                    ? `${d.timeLimitMinutes} phút/ngày`
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3 text-right text-gray-500">
                  {d.totalRequests.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[200, 180, 120].map((h) => (
        <div key={h} className="bg-gray-100 rounded-2xl animate-pulse" style={{ height: h }} />
      ))}
    </div>
  );
}
```

---

## D. COMPONENT MỚI: SessionHistoryTab.tsx

Tab "Phiên truy cập" — hiển thị danh sách session với thời lượng.

```typescript
// components/logs/SessionHistoryTab.tsx

import { useQuery } from '@tanstack/react-query';
import { logsApi } from '../../api/logs.api';
import { formatDuration, formatDateTime, formatRelativeTime } from '../../lib/formatters';

interface Props { childId: number; }

export function SessionHistoryTab({ childId }: Props) {
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', childId, fromDate, toDate, page],
    queryFn: () => logsApi.getSessions(childId, { fromDate, toDate, page }).then(r => r.data),
  });

  return (
    <div className="space-y-4 p-4">
      {/* Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Từ ngày</label>
          <input type="date" value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Đến ngày</label>
          <input type="date" value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
        </div>
      </div>

      {/* Session list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Không có phiên truy cập nào</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Website</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Bắt đầu</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Kết thúc</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Thời lượng</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.items.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.faviconUrl && (
                          <img src={s.faviconUrl} alt="" className="w-5 h-5 rounded flex-shrink-0" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 text-xs">
                            {s.displayName || s.domain}
                          </div>
                          <div className="text-xs text-gray-400">{s.domain}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {formatDateTime(s.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {s.endedAt ? formatDateTime(s.endedAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-gray-700">
                      {s.durationSeconds > 0
                        ? formatDuration(s.durationSeconds)
                        : s.isActive
                        ? <span className="text-green-600 animate-pulse">Đang dùng</span>
                        : '< 1 giây'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          Đang mở
                        </span>
                      ) : (
                        <span className="inline-flex bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                          Đã đóng
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {data?.totalCount} phiên truy cập
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Trước
                </button>
                <span className="px-3 py-1 text-xs text-gray-500">Trang {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= (data?.totalCount ?? 0)}
                  className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Sau →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## E. CẬP NHẬT ChildDetailPage.tsx — Thêm 2 tab mới

Tìm phần `<Tabs>` trong `ChildDetailPage.tsx`, thêm 2 tab:

```tsx
// Trước: [🌐 Website] [📋 Lịch sử] [📊 Thống kê]
// Sau:   [🌐 Website] [📋 Lịch sử] [⏱️ Phiên truy cập] [📊 Thống kê]

<Tabs defaultValue="websites">
  <TabsList className="grid grid-cols-4 w-full">
    <TabsTrigger value="websites">🌐 Website</TabsTrigger>
    <TabsTrigger value="logs">📋 Lịch sử</TabsTrigger>
    <TabsTrigger value="sessions">⏱️ Phiên truy cập</TabsTrigger>
    <TabsTrigger value="stats">📊 Thống kê</TabsTrigger>
  </TabsList>

  <TabsContent value="websites">
    {/* component đã có */}
  </TabsContent>

  <TabsContent value="logs">
    {/* component đã có */}
  </TabsContent>

  {/* ── Tab mới: Phiên truy cập ── */}
  <TabsContent value="sessions">
    <SessionHistoryTab childId={childId} />
  </TabsContent>

  {/* ── Tab mới: Thống kê ── */}
  <TabsContent value="stats">
    <UsageSummaryTab childId={childId} />
  </TabsContent>
</Tabs>
```

---

## F. CẬP NHẬT WebsiteCard — Hiển thị thời gian hôm nay

Tìm component `WebsiteCard.tsx`, đảm bảo hiển thị `todaySeconds` và progress:

```tsx
// Thêm vào trong WebsiteCard (phần hiển thị usage hôm nay):

{/* Thời gian hôm nay */}
<div className="mt-3 space-y-1.5">
  <div className="flex justify-between text-xs text-gray-500">
    <span>Hôm nay</span>
    <span className={website.limitExceeded ? 'text-red-600 font-semibold' : 'text-gray-700'}>
      {formatDuration(website.todaySeconds)}
      {website.timeLimitMinutes && (
        <> / {formatDuration(website.timeLimitMinutes * 60)}</>
      )}
    </span>
  </div>

  {/* Progress bar — chỉ hiện khi có time limit */}
  {website.timeLimitMinutes && (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${
          website.limitExceeded ? 'bg-red-500' : 'bg-violet-500'
        }`}
        style={{
          width: `${Math.min(100, (website.todaySeconds / (website.timeLimitMinutes * 60)) * 100)}%`
        }}
      />
    </div>
  )}
</div>
```

---

## G. REACT QUERY: Auto-refresh dữ liệu usage

Trong `ChildDetailPage.tsx`, thêm `refetchInterval` để data tự cập nhật:

```typescript
// Query websites (cập nhật mỗi 1 phút)
const { data: websites } = useQuery({
  queryKey: ['websites', childId],
  queryFn: () => websitesApi.getAll(childId).then(r => r.data),
  refetchInterval: 60_000,  // refresh mỗi 60 giây để cập nhật todaySeconds
});
```

---

## H. CHECKLIST FRONTEND

- [ ] Thêm types mới vào `types/log.types.ts` (WebSession, SessionsResponse, UsageSummary...)
- [ ] Thêm `getSessions` + `getSummary` vào `api/logs.api.ts`
- [ ] Tạo `components/logs/UsageSummaryTab.tsx` (bar chart + line chart + bảng)
- [ ] Tạo `components/logs/SessionHistoryTab.tsx` (bảng session + phân trang)
- [ ] Cập nhật `ChildDetailPage.tsx`: đổi từ 3 tab → 4 tab, thêm 2 tab mới
- [ ] Cập nhật `WebsiteCard.tsx`: thêm progress bar usage hôm nay
- [ ] Thêm `refetchInterval: 60_000` vào query websites