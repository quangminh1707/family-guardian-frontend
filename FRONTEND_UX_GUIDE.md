# 🎨 Frontend UX — Toast, Confirm Modal, Edit Website

> Chức năng đã có: giữ nguyên hoàn toàn.  
> Chỉ thêm/sửa những gì được liệt kê dưới đây.

---

## Cấu trúc folder mới

```
src/
└── components/
    └── feedback/               ← folder mới, chứa tất cả UI phản hồi
        ├── Toast.tsx           ← component hiển thị toast
        ├── toastStore.ts       ← zustand store quản lý danh sách toast
        ├── ConfirmModal.tsx    ← modal xác nhận dùng chung
        └── index.ts            ← export tất cả
```

---

## 1. Toast Notification

### `src/components/feedback/toastStore.ts`

Dùng **Zustand** (đã có sẵn trong dự án).

```typescript
interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'delete' | 'warning' | 'info';
  duration?: number; // ms, default 3500
}
```

Export hàm tiện ích để gọi từ bất kỳ đâu:
```typescript
export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error:   (message: string) => addToast(message, 'error'),
  delete:  (message: string) => addToast(message, 'delete'),
  warning: (message: string) => addToast(message, 'warning'),
};
```

### `src/components/feedback/Toast.tsx`

- Vị trí: **góc trên bên phải** — `fixed top-5 right-5 z-50`
- Hiển thị tối đa 5 toast cùng lúc, xếp dọc, gap-3
- Animation: slide in từ phải, fade out khi tự đóng
- Tự đóng sau `duration` ms (default 3500)
- Có nút X để đóng thủ công

**Màu sắc theo type:**

| type | màu nền | màu chữ | icon |
|---|---|---|---|
| `success` | `bg-green-500` | trắng | `✓` CheckCircle2 |
| `error` | `bg-red-500` | trắng | `✕` XCircle |
| `delete` | `bg-orange-500` | trắng | 🗑 Trash2 |
| `warning` | `bg-yellow-500` | trắng | ⚠ AlertTriangle |
| `info` | `bg-blue-500` | trắng | ℹ Info |

**Style chung:** `rounded-2xl px-4 py-3 shadow-xl min-w-[280px] max-w-[360px]`

### `src/components/feedback/index.ts`

```typescript
export { default as Toast } from './Toast';
export { toast } from './toastStore';
export { default as ConfirmModal } from './ConfirmModal';
```

### Gắn Toast vào layout

**Frontend — `src/layouts/AppLayout.tsx`:**
- Import `Toast` từ `feedback/`
- Render `<Toast />` một lần duy nhất trong layout, ngoài tất cả children

---

## 2. Confirm Modal

### `src/components/feedback/ConfirmModal.tsx`

Props:
```typescript
interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;       // default: "Xác nhận"
  cancelLabel?: string;        // default: "Hủy"
  variant?: 'danger' | 'warning' | 'default'; // màu nút confirm
  onConfirm: () => void;
  onCancel: () => void;
}
```

Style:
- Overlay: `fixed inset-0 bg-black/40 backdrop-blur-sm z-50`
- Modal box: `bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl`
- Animation: scale in từ 0.95 → 1
- Nút Cancel: `variant="outline"`
- Nút Confirm `variant="danger"`: `bg-red-500 hover:bg-red-600 text-white`
- Nút Confirm `variant="warning"`: `bg-orange-500 hover:bg-orange-600 text-white`
- Nút Confirm `variant="default"`: `bg-violet-600 hover:bg-violet-700 text-white`

---

## 3. Chỗ nào dùng ConfirmModal

### 3a. Đăng xuất — **Frontend `Topbar.tsx`**

Khi nhấn "Đăng xuất" trong dropdown avatar:
- **Không** gọi `logout()` ngay
- Mở `ConfirmModal` với:
  ```
  title:        "Đăng xuất"
  message:      "Bạn có chắc muốn đăng xuất không?"
  confirmLabel: "Đăng xuất"
  variant:      "danger"
  onConfirm:    () => logout()
  ```

### 3b. Xóa tài khoản con — **Frontend `ChildrenPage.tsx` hoặc `ChildDetailPage.tsx`**

Khi nhấn nút xóa liên kết con:
```
title:        "Xóa liên kết"
message:      "Bạn có chắc muốn xóa liên kết với [tên con]? Hành động này không thể hoàn tác."
confirmLabel: "Xóa"
variant:      "danger"
onConfirm:    () => deleteChild(childId)
```

### 3c. Xóa website khỏi danh sách con — **Frontend `ChildDetailPage.tsx`**

```
title:        "Xóa website"
message:      "Xóa [domain] khỏi danh sách cho phép?"
confirmLabel: "Xóa"
variant:      "danger"
onConfirm:    () => deleteWebsite(websiteId)
```

### 3d. Xóa cấu hình cảnh báo — **Frontend `WarningConfigModal.tsx`**

```
title:        "Xóa cấu hình cảnh báo"
message:      "Xóa cấu hình cảnh báo cho [domain]?"
confirmLabel: "Xóa"
variant:      "warning"
onConfirn:    () => deleteConfig(configId)
```

---

## 4. Thêm toast vào các mutation hiện có

Với **mỗi** `useMutation` trong dự án, thêm vào `onSuccess` và `onError`:

```typescript
// Ví dụ pattern chung
const mutation = useMutation({
  mutationFn: ...,
  onSuccess: () => {
    toast.success('Thêm website thành công');
    queryClient.invalidateQueries(...);
  },
  onError: () => {
    toast.error('Có lỗi xảy ra, vui lòng thử lại');
  },
});
```

**Danh sách mutation cần thêm toast:**

| File | Action | Toast Success | Toast Error |
|---|---|---|---|
| `ChildDetailPage.tsx` | Thêm website | `'Thêm website thành công'` | `'Không thể thêm website'` |
| `ChildDetailPage.tsx` | Xóa website | `'Đã xóa website'` (type: delete) | `'Không thể xóa website'` |
| `ChildDetailPage.tsx` | Sửa website | `'Đã cập nhật website'` | `'Không thể cập nhật'` |
| `ChildDetailPage.tsx` | Bật/tắt filter | `'Đã cập nhật bộ lọc'` | `'Không thể cập nhật'` |
| `WarningConfigModal.tsx` | Lưu config | `'Đã lưu cấu hình cảnh báo'` | `'Không thể lưu cấu hình'` |
| `WarningConfigModal.tsx` | Xóa config | `'Đã xóa cấu hình'` (type: delete) | `'Không thể xóa'` |
| `NotificationsPage.tsx` | Đánh dấu đã đọc | `'Đã đánh dấu đã đọc'` | `'Có lỗi xảy ra'` |
| `NotificationsPage.tsx` | Đọc tất cả | `'Đã đọc tất cả thông báo'` | `'Có lỗi xảy ra'` |

---

## 5. Edit Website inline — không xóa rồi tạo lại

### Backend

**Kiểm tra:** API `PUT /api/children/{childId}/websites/{websiteId}` đã có chưa.  
Nếu chưa có, thêm endpoint sau vào controller quản lý website của con:

```
PUT /api/children/{childId}/websites/{websiteId}
Body: { domain: string, timeLimitMinutes: number | null }
- Validate: guardian phải là chủ của childId
- Update domain và timeLimitMinutes trong bảng allowed_websites
- Return: website đã được update
```

### Frontend — `ChildDetailPage.tsx`

Mỗi `WebsiteCard` (hoặc dòng website) thêm **nút chỉnh sửa (icon Pencil)**. Khi nhấn:

**Trạng thái View (mặc định):**
```
[ 🌐 youtube.com ]  [ ⏱ 60 phút ]  [ ✏️ ]  [ 🗑 ]
```

**Trạng thái Edit (khi nhấn ✏️):**
- Dòng đó chuyển thành inline form:
```
[ input: domain        ]  [ input: số phút ]  [ ✓ Lưu ]  [ ✕ Hủy ]
```
- Input domain: `type="text"`, prefill bằng domain hiện tại
- Input thời gian: `type="number" min=1`, prefill bằng `timeLimitMinutes` hiện tại, placeholder "Không giới hạn"
- Nhấn ✓ Lưu → gọi mutation PUT, onSuccess → toast.success + thoát edit mode
- Nhấn ✕ Hủy → thoát edit mode, không gọi API

**State management:** dùng `useState<number | null>(null)` lưu `editingWebsiteId`. Chỉ 1 website được edit tại 1 thời điểm.

**Mutation:**
```typescript
const editWebsiteMutation = useMutation({
  mutationFn: ({ websiteId, domain, timeLimitMinutes }) =>
    childrenApi.updateWebsite(childId, websiteId, { domain, timeLimitMinutes }),
  onSuccess: () => {
    toast.success('Đã cập nhật website');
    setEditingWebsiteId(null);
    queryClient.invalidateQueries({ queryKey: ['child', childId] });
  },
  onError: () => toast.error('Không thể cập nhật website'),
});
```

---

## SQL (nếu cần)

Chỉ cần nếu stored procedure `sp_GetChildWebsites` hoặc tương tự không trả về đủ field để update.  
Kiểm tra bảng `allowed_websites` — nếu đã có `domain` và `time_limit_minutes` là đủ, không cần migration.

---

## Checklist hoàn thành

**Folder & files:**
- [ ] Tạo `src/components/feedback/toastStore.ts`
- [ ] Tạo `src/components/feedback/Toast.tsx`
- [ ] Tạo `src/components/feedback/ConfirmModal.tsx`
- [ ] Tạo `src/components/feedback/index.ts`

**Gắn vào app:**
- [ ] `AppLayout.tsx` render `<Toast />` một lần
- [ ] `Topbar.tsx` — đăng xuất mở ConfirmModal
- [ ] `ChildDetailPage.tsx` — xóa website mở ConfirmModal
- [ ] `ChildDetailPage.tsx` — xóa con mở ConfirmModal (nếu có nút xóa ở đây)
- [ ] `WarningConfigModal.tsx` — xóa config mở ConfirmModal

**Toast:**
- [ ] Tất cả mutation trong bảng mục 4 có `onSuccess` toast và `onError` toast

**Edit website inline:**
- [ ] Backend: endpoint `PUT /api/children/{childId}/websites/{websiteId}` hoạt động
- [ ] Frontend: WebsiteCard có nút ✏️, chuyển sang inline form khi nhấn
- [ ] Lưu thành công → toast success + thoát edit mode
- [ ] Hủy → thoát edit mode không gọi API
