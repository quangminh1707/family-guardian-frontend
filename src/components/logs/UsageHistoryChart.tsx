import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { UsageHistory } from '../../types/log.types';
import { formatDuration } from '../../lib/formatters';

interface UsageHistoryChartProps {
  data: UsageHistory[];
}

export default function UsageHistoryChart({ data }: UsageHistoryChartProps) {
  // Chuẩn bị dữ liệu cho chart: lấy top 10 website dùng nhiều nhất
  const chartData = data
    .slice(0, 10)
    .map(item => ({
      name: item.displayName || item.domain,
      seconds: item.totalSeconds,
      limitSeconds: item.timeLimitMinutes ? item.timeLimitMinutes * 60 : 0,
      limitExceeded: item.limitExceeded,
      domain: item.domain
    }))
    .reverse();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl border border-gray-800 animate-in zoom-in-95 duration-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-1">{data.domain}</p>
          <p className="font-bold text-sm mb-1">{data.name}</p>
          <p className="text-xl font-black">{formatDuration(data.seconds)}</p>
          {data.limitSeconds > 0 && (
            <div className={`mt-2 pt-2 border-t border-gray-800 text-[10px] font-bold flex items-center gap-2 ${data.limitExceeded ? 'text-red-400' : 'text-gray-400'}`}>
               GIỚI HẠN: {formatDuration(data.limitSeconds)}
               {data.limitExceeded && <span className="bg-red-500/10 px-1.5 py-0.5 rounded uppercase">Vượt quá</span>}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis 
            type="number" 
            hide 
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar 
            dataKey="seconds" 
            radius={[0, 12, 12, 0]} 
            barSize={24}
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.limitExceeded ? '#ef4444' : '#7c3aed'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
