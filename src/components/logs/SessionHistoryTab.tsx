import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsApi } from '../../api/logs.api';
import { formatDuration, formatDateTime } from '../../lib/formatters';
import { Calendar, Monitor, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-6 p-4">
      {/* Filter */}
      <div className="bg-bg-surface border-border-base p-6 rounded-[2rem] border  shadow-sm flex flex-wrap gap-6 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-tx-primary uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            Từ ngày
          </label>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="border-none bg-bg-subtle rounded-xl px-4 py-2.5 text-sm font-bold text-tx-primary outline-none ring-2 ring-transparent focus:ring-violet-200 transition-all" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-tx-primary uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            Đến ngày
          </label>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="border-none bg-bg-subtle rounded-xl px-4 py-2.5 text-sm font-bold text-tx-primary outline-none ring-2 ring-transparent focus:ring-violet-200 transition-all" 
          />
        </div>
      </div>

      {/* Session list */}
      <div className="bg-bg-surface border-border-base rounded-[2.5rem] border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center">
            <div className="w-12 h-12 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-tx-muted uppercase tracking-widest">Đang tải dữ liệu...</p>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-bg-subtle rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-tx-primary">Không có dữ liệu</h3>
            <p className="text-tx-secondary mt-2 font-medium">Không tìm thấy phiên truy cập nào trong khoảng thời gian này.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead className="bg-bg-subtle border-b border-border-base">
                    <tr>
                    <th className="text-left px-8 py-5 text-tx-muted font-bold uppercase tracking-widest text-[10px]">
                        <div className="flex items-center gap-2"><Monitor className="w-3 h-3" /> Website</div>
                    </th>
                    <th className="text-left px-8 py-5 text-tx-muted font-bold uppercase tracking-widest text-[10px]">Bắt đầu</th>
                    <th className="text-left px-8 py-5 text-tx-muted font-bold uppercase tracking-widest text-[10px]">Kết thúc</th>
                    <th className="text-right px-8 py-5 text-tx-muted font-bold uppercase tracking-widest text-[10px]">Thời lượng</th>
                    <th className="text-center px-8 py-5 text-tx-muted font-bold uppercase tracking-widest text-[10px]">Trạng thái</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                    {data?.items.map((s) => (
                    <tr key={s.id} className="hover:bg-bg-subtle/50 transition-colors group">
                        <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                            {s.faviconUrl ? (
                            <img src={s.faviconUrl} alt="" className="w-8 h-8 rounded-xl shadow-sm bg-bg-surface" />
                            ) : (
                                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-400 text-xs font-bold uppercase">
                                    {s.domain.charAt(0)}
                                </div>
                            )}
                            <div>
                            <div className="font-bold text-tx-primary">
                                {s.displayName || s.domain}
                            </div>
                            <div className="text-[10px] text-tx-muted font-bold uppercase tracking-tighter">{s.domain}</div>
                            </div>
                        </div>
                        </td>
                        <td className="px-8 py-4 text-tx-secondary font-medium text-xs">
                        {formatDateTime(s.startedAt)}
                        </td>
                        <td className="px-8 py-4 text-tx-secondary font-medium text-xs">
                        {s.endedAt ? formatDateTime(s.endedAt) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-8 py-4 text-right">
                            <span className="font-mono font-black text-gray-700">
                                {s.durationSeconds > 0
                                    ? formatDuration(s.durationSeconds)
                                    : s.isActive
                                    ? <span className="text-green-600 animate-pulse font-bold uppercase text-[10px] tracking-widest">Đang dùng</span>
                                    : '< 1 giây'}
                            </span>
                        </td>
                        <td className="px-8 py-4">
                         <div className="flex justify-center">
                            {s.isActive ? (
                                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-green-100/50">
                                <PlayCircle className="w-3 h-3 animate-pulse" />
                                Đang mở
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 bg-bg-subtle text-tx-secondary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-gray-200/30">
                                <CheckCircle2 className="w-3 h-3" />
                                Đã đóng
                                </span>
                            )}
                         </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-8 py-6 border-t border-border-base bg-bg-subtle/30 flex items-center justify-between">
              <span className="text-[10px] font-black text-tx-muted uppercase tracking-widest">
                Tổng cộng: <span className="text-tx-primary">{data?.totalCount}</span> phiên
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-surface border border-border-base text-tx-primary font-bold disabled:opacity-40 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all shadow-sm"
                >
                  ←
                </button>
                <span className="text-xs font-black text-tx-primary uppercase tracking-widest">Trang {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= (data?.totalCount ?? 0)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-surface border border-border-base text-tx-primary font-bold disabled:opacity-40 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all shadow-sm"
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
