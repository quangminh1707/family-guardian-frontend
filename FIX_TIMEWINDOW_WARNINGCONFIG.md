# 🔧 Fix: Hiển thị Khung Giờ trong WarningConfigModal — Tab "Khung Giờ (Tùy Chỉnh)"

> **Ngày tạo:** 2026-05-04  
> **Liên quan:** `WarningConfigModal.tsx` · `timeWindowWarningConfig.api.ts`  
> **Không thay đổi logic backend, SP, hoặc DB**

---

## 📌 Mô tả lỗi

Trong modal **"Cấu hình hệ thống"** → tab **"Khung Giờ (Tùy Chỉnh)"**:

### Lỗi 1 — Label website hiện "Chưa giới hạn" (Hình 4)
Phần **① CHỌN WEBSITE**, website `google.com` đang được set khung giờ `07:00 → 21:00` nhưng label bên dưới tên website vẫn hiện **"Chưa giới hạn"** thay vì hiện **"07:00 → 21:00"**.

### Lỗi 2 — Preview màu tím hiện sai giờ (Hình 3)
Phần **② KHUNG GIỜ CHO PHÉP**, preview tím hiện `"Con được dùng từ 08:00 đến 20:00 (12 giờ/ngày)"` — đây là **giờ mặc định hardcode của input**, không lấy từ `allowed_start_time / allowed_end_time` của website đã chọn (`07:00 → 21:00`).

---

## 🔍 Phân tích nguyên nhân

### Data flow hiện tại

```
API GET /children/{childId}/websites
  → sp_GetChildAllowedWebsites(childId)
  → trả về: id, domain, allowed_start_time, allowed_end_time, time_limit_minutes, ...

WarningConfigModal nhận prop: websites[] (đã có allowed_start_time/allowed_end_time)

Tab Khung giờ:
  - Lọc websites có timeLimitMinutes == null  ← ĐÚng
  - Render danh sách website để chọn
  - Khi chọn 1 website → state selectedWebsiteId thay đổi
  - Input giờ bắt đầu/kết thúc: khởi tạo DEFAULT 08:00 / 20:00  ← LỖI: không đọc từ website đã chọn
  - Label phụ trong danh sách: hiện "Chưa giới hạn" cứng  ← LỖI: phải đọc allowed_start_time
```

### Root cause

1. **Label "Chưa giới hạn"**: Component render label phụ dưới domain name nhưng **không check `allowed_start_time`**. Cần hiện `HH:mm → HH:mm` nếu có.

2. **Input giờ không populate**: Khi `selectedWebsiteId` thay đổi, component **không set lại state giờ** từ `website.allowed_start_time / allowed_end_time`. State `startTime` / `endTime` luôn giữ giá trị mặc định `08:00` / `20:00`.

---

## ✅ Kiểm tra Backend & API (không thay đổi)

### SP `sp_GetChildAllowedWebsites` — ĐÃ ĐÚNG ✅
SP đã trả về `allowed_start_time`, `allowed_end_time` đủ để frontend dùng.

```sql
-- SP trả về đủ các field (theo doc):
-- id, domain, display_name, favicon_url, is_active,
-- time_limit_minutes, allowed_start_time, allowed_end_time,
-- today_seconds, today_requests, limit_exceeded
-- KHÔNG CẦN SỬA BACKEND
```

### API `GET /children/{childId}/websites` — ĐÃ ĐÚNG ✅
Endpoint này đã map đủ field từ SP, không cần sửa.

### API `GET /timewindow-warning-configs/?allowedWebsiteId=X` — ĐÃ ĐÚNG ✅
Endpoint lấy config cảnh báo khung giờ đã đúng.

> **Kết luận: Toàn bộ backend không cần sửa. Lỗi chỉ ở frontend.**

---

## 🛠️ Hướng dẫn Fix Frontend

### File cần sửa: `src/components/WarningConfigModal.tsx`

---

### Fix 1 — Label website: Hiện khung giờ thay vì "Chưa giới hạn"

**Vị trí:** Phần render danh sách website trong tab Khung giờ (Step ① CHỌN WEBSITE)

**Trước (code lỗi):**
```tsx
// Đang hiện label cứng không điều kiện
<span className="text-xs text-tx-secondary">Chưa giới hạn</span>
```

**Sau (code fix):**
```tsx
// Helper format TIME từ "HH:mm:ss" → "HH:mm"
function formatTimeShort(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  return timeStr.substring(0, 5); // "07:00:00" → "07:00"
}

// Trong render danh sách website:
<span className="text-xs text-tx-secondary">
  {website.allowedStartTime && website.allowedEndTime
    ? `${formatTimeShort(website.allowedStartTime)} → ${formatTimeShort(website.allowedEndTime)}`
    : 'Chưa giới hạn'}
</span>
```

> **Lưu ý:** Backend trả về `allowed_start_time` dạng `"07:00:00"` (TIME MySQL). Cần `.substring(0, 5)` để lấy `"07:00"`.

---

### Fix 2 — Populate input giờ khi chọn website

**Vị trí:** `useEffect` hoặc handler khi `selectedWebsiteId` thay đổi trong tab Khung giờ

**Trước (code lỗi):**
```tsx
// State khởi tạo cứng, không bao giờ cập nhật theo website đã chọn
const [startTime, setStartTime] = useState('08:00');
const [endTime, setEndTime] = useState('20:00');
```

**Sau (code fix):**
```tsx
const [startTime, setStartTime] = useState('08:00');
const [endTime, setEndTime] = useState('20:00');

// Thêm useEffect: khi selectedWebsiteId thay đổi → populate từ website data
useEffect(() => {
  if (!selectedWebsiteId) return;

  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);
  if (!selectedWebsite) return;

  if (selectedWebsite.allowedStartTime) {
    // "07:00:00" → "07:00" (định dạng input type="time")
    setStartTime(selectedWebsite.allowedStartTime.substring(0, 5));
  } else {
    setStartTime('08:00'); // fallback default
  }

  if (selectedWebsite.allowedEndTime) {
    setEndTime(selectedWebsite.allowedEndTime.substring(0, 5));
  } else {
    setEndTime('20:00'); // fallback default
  }
}, [selectedWebsiteId, websites]);
```

---

### Fix 3 — Tính giờ/ngày đúng trong preview tím

Preview hiện tại đang tính số giờ từ `startTime`/`endTime` state — sau khi Fix 2 populate đúng, preview sẽ tự đúng. Tuy nhiên cần đảm bảo hàm tính không có bug:

```tsx
// Hàm tính số giờ trong khung giờ
function calcHoursPerDay(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMinutes <= 0) return '0 phút';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} phút`;
  if (mins === 0) return `${hours} giờ`;
  return `${hours} giờ ${mins} phút`;
}

// Preview render (hộp màu tím):
<div className="flex items-center gap-2 p-3 rounded-lg bg-brand/10 border border-brand/30 text-brand-DEFAULT text-sm">
  <Clock className="w-4 h-4 shrink-0" />
  <span>
    Con được dùng từ <strong>{startTime}</strong> đến <strong>{endTime}</strong>
    {' '}({calcHoursPerDay(startTime, endTime)}/ngày)
  </span>
</div>
```

---

### Fix 4 — Dark Mode compatibility

Theo CSS variables trong doc, cần dùng đúng class Tailwind cho dark mode:

```tsx
// ❌ Sai — dùng màu hardcode
className="bg-purple-100 text-purple-700 border-purple-300"

// ✅ Đúng — dùng CSS variables theo theme
className="bg-brand/10 border border-brand/30 text-brand-DEFAULT"

// Danh sách website card khi selected:
className={`
  cursor-pointer rounded-xl border p-3 transition-all
  ${selectedWebsiteId === website.id
    ? 'border-brand bg-brand/10'
    : 'border-border-base bg-bg-elevated hover:border-brand/50 hover:bg-bg-subtle'
  }
`}

// Label phụ:
className="text-xs text-tx-secondary"

// Tên website:
className="text-sm font-medium text-tx-primary"

// Input time:
className="
  w-full rounded-lg border border-border-base bg-bg-elevated
  px-3 py-2 text-sm text-tx-primary
  focus:outline-none focus:ring-2 focus:ring-brand/50
  dark:bg-bg-surface dark:text-tx-primary
"
```

---

## 📋 Checklist sửa code

```
[ ] Fix 1: Label website hiện "HH:mm → HH:mm" khi có allowedStartTime
[ ] Fix 2: useEffect populate startTime/endTime khi selectedWebsiteId thay đổi
[ ] Fix 3: Hàm calcHoursPerDay tính đúng số giờ/phút
[ ] Fix 4: Tất cả class Tailwind dùng CSS variables, không hardcode màu
[ ] Test: Mở modal → Tab Khung giờ → click google.com → kiểm tra input và preview
[ ] Test Dark mode: chuyển sang dark mode → kiểm tra màu nền/chữ/border đúng không
```

---

## 🧪 Test case

| Scenario | Expected result |
|----------|----------------|
| Mở modal, Tab Khung giờ, danh sách website | google.com hiện label "07:00 → 21:00" |
| Click chọn google.com | Input Giờ bắt đầu tự set "07:00", Giờ kết thúc tự set "21:00" |
| Preview tím hiện | "Con được dùng từ 07:00 đến 21:00 (14 giờ/ngày)" |
| Website chưa set khung giờ (chỉ null) | Label hiện "Chưa giới hạn", input giữ default 08:00/20:00 |
| Dark mode bật | Background tối, chữ sáng, border/brand đúng |
| Lưu khung giờ | Gọi API POST `/timewindow-warning-configs/` đúng payload |

---

## ⚠️ Không thay đổi

- Không sửa bất kỳ API backend nào
- Không sửa stored procedure
- Không sửa database schema
- Không sửa logic Tab 1 (Cảnh báo giới hạn phút)
- Không sửa `WebsiteCard.tsx`, `EditWebsiteModal.tsx`, `ChildDetailPage.tsx`
- Logic lưu/xóa config khung giờ giữ nguyên

---

## 📁 File liên quan

| File | Thay đổi |
|------|----------|
| `src/components/WarningConfigModal.tsx` | **SỬA** — Fix 1, 2, 3, 4 |
| `src/api/timeWindowWarningConfig.api.ts` | Không thay đổi |
| `src/styles/themes/dark.css` | Không thay đổi |
| `src/styles/themes/light.css` | Không thay đổi |

---

> **SQL:** Không có SQL nào cần tạo cho fix này. Backend và DB đã đúng.
