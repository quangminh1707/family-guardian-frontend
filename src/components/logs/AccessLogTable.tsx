import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import type { AccessLog } from '../../types/log.types';
import { formatDateTime, formatDuration, getFaviconUrl } from '../../lib/formatters';
import { 
  Globe, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface AccessLogTableProps {
  logs: AccessLog[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
}

const columnHelper = createColumnHelper<AccessLog>();

export default function AccessLogTable({ logs, total, page, onPageChange, pageSize }: AccessLogTableProps) {
  const columns = [
    columnHelper.accessor('sessionStart', {
      header: 'Thời gian',
      cell: info => (
        <div className="flex flex-col">
          <span className="font-bold text-tx-primary">{formatDateTime(info.getValue())}</span>
          <span className="text-[10px] text-tx-muted font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
             <Calendar className="w-3 h-3" />
             Bắt đầu phiên
          </span>
        </div>
      ),
    }),
    columnHelper.accessor('domain', {
      header: 'Website',
      cell: info => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-bg-subtle rounded-xl flex items-center justify-center border border-border-base shrink-0">
             {info.row.original.domain ? (
               <img
                 src={getFaviconUrl(info.row.original.domain)}
                 alt=""
                 className="w-6 h-6 rounded"
                 onError={(e) => {
                   (e.currentTarget as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${info.row.original.domain}&sz=32`;
                 }}
               />
             ) : (
               <Globe className="w-5 h-5 text-tx-muted" />
             )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-tx-primary truncate">{info.row.original.displayName || info.getValue()}</span>
            <span className="text-xs text-tx-muted truncate">{info.row.original.fullUrl || info.getValue()}</span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('accessResult', {
      header: 'Kết quả',
      cell: info => (
        <Badge className={cn(
          "rounded-full px-4 py-1.5 font-bold uppercase tracking-[0.1em] text-[10px] border-2",
          info.getValue() === 'allowed' 
            ? "bg-success/10 text-success border-success/20" 
            : "bg-error/10 text-error border-error/20"
        )}>
          {info.getValue() === 'allowed' ? (
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Cho phép</span>
          ) : (
            <span className="flex items-center gap-1.5"><ShieldAlert className="w-3 h-3" /> Bị chặn</span>
          )}
        </Badge>
      ),
    }),
    columnHelper.accessor('durationSeconds', {
      header: 'Thời lượng',
      cell: info => (
        <div className="flex items-center gap-2 font-bold text-tx-secondary">
          <Clock className="w-4 h-4 text-brand/60" />
          {info.getValue() > 0 ? formatDuration(info.getValue()) : '-'}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(total / pageSize);

  const handleExport = () => {
    const headers = ['Thời gian', 'Website', 'URL', 'Kết quả', 'Thời lượng (s)'];
    const csvContent = [
      headers.join(','),
      ...logs.map(l => [
        formatDateTime(l.sessionStart),
        l.displayName || l.domain,
        l.fullUrl || l.domain,
        l.accessResult,
        l.durationSeconds
      ].join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `access_logs_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
         <div className="text-sm font-bold text-tx-muted uppercase tracking-widest">
            Hiển thị <span className="text-brand">{(page-1)*pageSize + 1}-{Math.min(page*pageSize, total)}</span> / {total} kết quả
         </div>
         <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          className="rounded-xl font-bold uppercase tracking-wider text-[10px] gap-2 border-border-base hover:bg-bg-subtle"
         >
           <Download className="w-4 h-4" />
           Xuất CSV
         </Button>
      </div>

      <div className="bg-bg-surface rounded-[2rem] border border-border-base overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-border-subtle bg-bg-subtle/50">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-tx-muted">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="group hover:bg-brand-subtle/30 transition-colors border-b border-border-subtle last:border-none">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={100} className="p-20 text-center">
                   <div className="flex flex-col items-center gap-4 text-tx-muted">
                      <Globe className="w-12 h-12 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-xs">Không có dữ liệu truy cập</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button 
          variant="ghost" 
          disabled={page <= 1} 
          onClick={() => onPageChange(page - 1)}
          className="rounded-xl h-10 w-10 p-0 text-gray-400"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
             const p = i + 1;
             return (
               <Button 
                key={p} 
                variant={page === p ? 'default' : 'ghost'}
                onClick={() => onPageChange(p)}
                className={cn(
                  "rounded-xl h-10 w-10 font-bold",
                  page === p ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-tx-muted"
                )}
               >
                 {p}
               </Button>
             );
          })}
        </div>
        <Button 
          variant="ghost" 
          disabled={page >= totalPages} 
          onClick={() => onPageChange(page + 1)}
          className="rounded-xl h-10 w-10 p-0 text-gray-400"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
