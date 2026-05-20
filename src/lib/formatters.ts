/**
 * Parse datetime string từ backend.
 * Backend dùng DateTime.Now (local UTC+7) -> string không có suffix
 * -> JS new Date() tự hiểu là local time -> ĐÚNG, KHÔNG cần append 'Z'
 * Nếu string đã có suffix (Z hoặc +07:00) -> giữ nguyên
 */
export function normalizeBackendDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  return new Date(dateStr);
}

/**
 * Format giờ 24h: "16:27", "08:05"
 */
export function formatTimeVN(dateStr: string): string {
  const date = normalizeBackendDate(dateStr);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Format ngày + giờ đầy đủ cho card yêu cầu
 * Kết quả: "Hôm nay 16:27", "Hôm qua 08:05", "10/05 14:30"
 */
export function formatDateTimeVN(dateStr: string): string {
  const date = normalizeBackendDate(dateStr);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return `Hôm nay ${formatTimeVN(dateStr)}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return `Hôm qua ${formatTimeVN(dateStr)}`;

  const d = date.getDate().toString().padStart(2, '0');
  const mo = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${d}/${mo} ${formatTimeVN(dateStr)}`;
}

/**
 * Format thời gian tương đối: "vừa xong", "5 phút trước", "2 giờ trước"
 * Dùng Date.now() để tính diff — không phụ thuộc timezone server
 */
export function formatRelativeTime(dateStr: string): string {
  const date = normalizeBackendDate(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'hôm qua';
  return `${diffD} ngày trước`;
}

export function formatDateTime(dateStr: string): string {
  const date = normalizeBackendDate(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
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
  const totalMinutes = eh * 60 + em - (sh * 60 + sm);

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

// Tính giờ kết thúc mới khi có bonus phút cho khung giờ
export function formatExtendedEndTime(endTimeStr: string, bonusSeconds: number): string {
  const [hoursStr = '0', minutesStr = '0'] = endTimeStr.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return endTimeStr.substring(0, 5);
  }

  const totalMinutes = hours * 60 + minutes + Math.floor(bonusSeconds / 60);
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;

  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}
