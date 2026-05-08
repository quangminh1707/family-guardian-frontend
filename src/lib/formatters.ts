/**
 * Normalize date string về UTC.
 * Backend dùng DateTime.UtcNow nhưng serialize không có 'Z' suffix
 * → Chrome interpret là local time (UTC+7) → lệch 7 tiếng.
 * Fix: gắn 'Z' nếu chưa có timezone info.
 */
function toUtcDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  const hasTimezone = dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr);
  return new Date(hasTimezone ? dateStr : dateStr + 'Z');
}

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '—';
  const date = toUtcDate(dateStr);
  if (isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'Vừa xong';
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const date = toUtcDate(dateStr);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  }).format(date);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

function formatTimeShort(timeStr: string): string {
  return timeStr.substring(0, 5);
}

function formatTimeDuration(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);

  if (totalMinutes <= 0) return '0 phút';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} phút`;
  if (minutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${minutes} phút`;
}

export function formatTimeRange(startTime?: string | null, endTime?: string | null): string {
  if (!startTime || !endTime) return 'Không có khung giờ';
  return `${formatTimeShort(startTime)} → ${formatTimeShort(endTime)} · ${formatTimeDuration(startTime, endTime)}/ngày`;
}

export function formatUsagePercent(seconds: number, limitMinutes?: number): number | null {
  if (!limitMinutes) return null;
  return Math.min(100, Math.round((seconds / (limitMinutes * 60)) * 100));
}
