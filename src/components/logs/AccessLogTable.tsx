import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import type { AccessLog } from '../../types/log.types';
import { formatDateTime, formatDuration } from '../../lib/formatters';
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
          <span className="font-bold text-gray-900">{formatDateTime(info.getValue())}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
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
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0">
             {info.row.original.faviconUrl ? (
               <img src={info.row.original.faviconUrl} alt="" className="w-6 h-6 rounded" />
             ) : (
               <Globe className="w-5 h-5 text-gray-400" />
             )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 truncate">{info.row.original.displayName || info.getValue()}</span>
            <span className="text-xs text-gray-400 truncate">{info.row.original.fullUrl || info.getValue()}</span>
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
            ? "bg-green-50 text-green-700 border-green-100" 
            : "bg-red-50 text-red-700 border-red-100"
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
        <div className="flex items-center gap-2 font-bold text-gray-700">
          <Clock className="w-4 h-4 text-violet-400" />
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
         <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Hiển thị <span className="text-violet-600">{(page-1)*pageSize + 1}-{Math.min(page*pageSize, total)}</span> / {total} kết quả
         </div>
         <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          className="rounded-xl font-bold uppercase tracking-wider text-[10px] gap-2 border-gray-100 hover:bg-gray-50"
         >
           <Download className="w-4 h-4" />
           Xuất CSV
         </Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-gray-50 bg-gray-50/50">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="group hover:bg-violet-50/30 transition-colors border-b border-gray-50 last:border-none">
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
                   <div className="flex flex-col items-center gap-4 text-gray-400">
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
                  page === p ? "bg-violet-600 text-white shadow-lg shadow-violet-200" : "text-gray-400"
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
