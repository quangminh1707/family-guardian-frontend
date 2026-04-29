# 🌙 Dark Mode — Làm lại toàn bộ giao diện tối

> **Giữ nguyên:** Toàn bộ logic, API, state management, routing.  
> **Chỉ thay đổi:** CSS/Tailwind classes liên quan đến màu sắc, background, border, shadow.  
> Hệ thống đã có nút toggle dark mode — chỉ cần đảm bảo tất cả component phản ứng đúng.

---

## Nguyên tắc kỹ thuật

Dự án dùng **Tailwind CSS** với `darkMode: 'class'` — khi `<html>` có class `dark`, tất cả `dark:*` class được kích hoạt.

**Kiểm tra `tailwind.config.js`** — phải có:
```js
module.exports = {
  darkMode: 'class',
  // ...
}
```

**Kiểm tra logic toggle** trong store/hook hiện có — phải gán class `dark` lên `document.documentElement`:
```ts
// Đúng
document.documentElement.classList.toggle('dark', isDark);

// Sai (không hoạt động với darkMode: 'class')
document.body.classList.toggle('dark', isDark);
```

---

## Cấu trúc folder CSS tách riêng

Tạo folder `src/styles/themes/` để quản lý màu sắc tập trung:

```
src/styles/
├── themes/
│   ├── light.css     ← CSS variables cho chế độ sáng
│   ├── dark.css      ← CSS variables cho chế độ tối
│   └── index.css     ← Import cả 2, export dùng trong main.tsx
└── globals.css       ← Giữ nguyên file gốc, chỉ thêm @import themes/index.css
```

### `src/styles/themes/light.css`

```css
:root {
  /* Background */
  --bg-base:        #f8f8fb;
  --bg-surface:     #ffffff;
  --bg-elevated:    #ffffff;
  --bg-subtle:      #f3f4f6;
  --bg-muted:       #e5e7eb;

  /* Text */
  --text-primary:   #0f0f13;
  --text-secondary: #4b5563;
  --text-muted:     #9ca3af;
  --text-inverse:   #ffffff;

  /* Border */
  --border-base:    #e5e7eb;
  --border-subtle:  #f3f4f6;
  --border-strong:  #d1d5db;

  /* Brand */
  --brand:          #7c3aed;
  --brand-hover:    #6d28d9;
  --brand-subtle:   #ede9fe;
  --brand-text:     #7c3aed;

  /* Status */
  --success:        #16a34a;
  --success-bg:     #f0fdf4;
  --error:          #dc2626;
  --error-bg:       #fef2f2;
  --warning:        #d97706;
  --warning-bg:     #fffbeb;

  /* Shadow */
  --shadow-sm:      0 1px 3px rgba(0,0,0,0.08);
  --shadow-md:      0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg:      0 8px 32px rgba(0,0,0,0.10);
}
```

### `src/styles/themes/dark.css`

```css
/* ── Màu tối dễ nhìn ban đêm — nền xanh xám đậm, không thuần đen ── */
.dark {
  /* Background — dùng tone xanh xám ấm, không pure black */
  --bg-base:        #0d1117;   /* nền toàn trang */
  --bg-surface:     #161b22;   /* card, modal, panel */
  --bg-elevated:    #1c2128;   /* dropdown, tooltip, popover */
  --bg-subtle:      #21262d;   /* input, hover state */
  --bg-muted:       #30363d;   /* disabled, skeleton */

  /* Text */
  --text-primary:   #e6edf3;   /* chữ chính — không pure white, dễ nhìn hơn */
  --text-secondary: #8b949e;   /* chữ phụ */
  --text-muted:     #484f58;   /* placeholder, disabled */
  --text-inverse:   #0d1117;

  /* Border */
  --border-base:    #30363d;
  --border-subtle:  #21262d;
  --border-strong:  #484f58;

  /* Brand — giữ violet nhưng sáng hơn để nổi trên nền tối */
  --brand:          #a78bfa;
  --brand-hover:    #c4b5fd;
  --brand-subtle:   #1e1433;
  --brand-text:     #a78bfa;

  /* Status */
  --success:        #3fb950;
  --success-bg:     #0d2818;
  --error:          #f85149;
  --error-bg:       #2d1117;
  --warning:        #d29922;
  --warning-bg:     #272115;

  /* Shadow — tối thì không cần shadow mạnh, dùng border thay thế */
  --shadow-sm:      0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:      0 4px 16px rgba(0,0,0,0.4);
  --shadow-lg:      0 8px 32px rgba(0,0,0,0.5);
}
```

### `src/styles/themes/index.css`

```css
@import './light.css';
@import './dark.css';
```

### `src/styles/globals.css` — thêm vào đầu file

```css
@import './themes/index.css';
/* ... phần còn lại giữ nguyên */
```

---

## Mapping CSS variables vào Tailwind

### `tailwind.config.js` — thêm vào `extend.colors`

```js
extend: {
  colors: {
    bg: {
      base:     'var(--bg-base)',
      surface:  'var(--bg-surface)',
      elevated: 'var(--bg-elevated)',
      subtle:   'var(--bg-subtle)',
      muted:    'var(--bg-muted)',
    },
    tx: {
      primary:   'var(--text-primary)',
      secondary: 'var(--text-secondary)',
      muted:     'var(--text-muted)',
    },
    border: {
      base:   'var(--border-base)',
      subtle: 'var(--border-subtle)',
      strong: 'var(--border-strong)',
    },
    brand: {
      DEFAULT: 'var(--brand)',
      hover:   'var(--brand-hover)',
      subtle:  'var(--brand-subtle)',
      text:    'var(--brand-text)',
    },
  },
},
```

---

## Danh sách component cần thêm dark class

Với mỗi component/page dưới đây, thay thế màu hardcode bằng CSS variable hoặc thêm `dark:` prefix.

### Quy tắc thay thế nhanh

| Màu sáng hiện tại | Thay bằng |
|---|---|
| `bg-white` | `bg-bg-surface` |
| `bg-gray-50` | `bg-bg-subtle` |
| `bg-gray-100` | `bg-bg-muted` |
| `bg-f8f8fb` hoặc nền trang | `bg-bg-base` |
| `text-gray-900` | `text-tx-primary` |
| `text-gray-500`, `text-gray-600` | `text-tx-secondary` |
| `text-gray-400` | `text-tx-muted` |
| `border-gray-100`, `border-gray-200` | `border-border-base` |
| `shadow-sm`, `shadow-md` | giữ nguyên (shadow đã dùng CSS var) |

---

## Checklist từng file cần sửa — **Frontend**

### Layout
- [ ] **`AppLayout.tsx`** — nền tổng thể `bg-bg-base`, sidebar, main content
- [ ] **`Sidebar.tsx`** — nền sidebar, active item, hover, text, icon, border phân cách
- [ ] **`Topbar.tsx`** — nền header, input search, dropdown avatar

### Pages
- [ ] **`DashboardPage.tsx`** — card thống kê, nền trang
- [ ] **`ChildrenPage.tsx`** — card từng con, badge trạng thái, nền trang
- [ ] **`ChildDetailPage.tsx`** — header con, tab bar, WebsiteCard, progress bar, bảng lịch sử
- [ ] **`NotificationsPage.tsx`** — card thông báo, badge unread, nền trang
- [ ] **`SettingsPage.tsx`** — nếu có

### Components
- [ ] **`WebsiteCard.tsx`** — card, toggle, progress bar, icon trạng thái
- [ ] **`FilterToggle.tsx`** — toggle, label
- [ ] **`WarningConfigModal.tsx`** — modal overlay, input, slider, card config list
- [ ] **`feedback/Toast.tsx`** — nền toast, border, icon bg (dùng CSS var thay vì hardcode `bg-white`)
- [ ] **`feedback/ConfirmModal.tsx`** — overlay, modal box, button

### UI primitives (shadcn/ui wrappers)
- [ ] **`components/ui/button.tsx`** — các variant (outline, ghost)
- [ ] **`components/ui/input.tsx`** — nền input, border, placeholder, focus ring
- [ ] **`components/ui/skeleton.tsx`** — màu skeleton animation
- [ ] **`components/ui/dropdown-menu.tsx`** — nền dropdown, item hover, separator
- [ ] **`components/ui/badge.tsx`** — các variant badge

---

## Các trường hợp đặc biệt cần chú ý

### 1. Sidebar tối vs sáng
Sidebar hiện tại dùng nền tối `bg-[#0f0f13]` ở cả 2 mode — **giữ nguyên sidebar tối**, chỉ điều chỉnh text và active state cho phù hợp với dark mode tổng thể.

### 2. Card WebsiteCard
```tsx
// Thay
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

// Thành
<div className="bg-bg-surface rounded-2xl border border-border-base shadow-sm">
```

### 3. Input search Topbar
```tsx
// Thay
className="bg-gray-50 border-none rounded-xl..."

// Thành
className="bg-bg-subtle border border-border-subtle rounded-xl text-tx-primary placeholder:text-tx-muted..."
```

### 4. Progress bar thời gian
```tsx
// Track (nền)
<div className="bg-gray-100 dark:bg-bg-muted rounded-full">
  // Fill — giữ màu violet/xanh, không đổi
  <div className="bg-violet-500 rounded-full" />
</div>
```

### 5. Badge trạng thái (online/offline, an toàn/bị chặn)
Các badge màu xanh/đỏ giữ nguyên màu sắc, chỉ đổi nền:
```tsx
// An toàn
"bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"

// Bị chặn
"bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
```

### 6. Modal overlay
```tsx
// Giữ nguyên — hoạt động tốt ở cả 2 mode
"fixed inset-0 bg-black/40 backdrop-blur-sm"
```

### 7. ScrollBar (tùy chọn, thêm vào globals.css)
```css
.dark ::-webkit-scrollbar { width: 6px; }
.dark ::-webkit-scrollbar-track { background: var(--bg-subtle); }
.dark ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }
```

---

## Kiểm tra không bị trùng/conflict

Sau khi sửa, chạy lệnh tìm class hardcode còn sót:

```bash
# Tìm bg-white còn sót
grep -r "bg-white" src/components src/pages --include="*.tsx"

# Tìm text-gray-900 còn sót
grep -r "text-gray-900" src/components src/pages --include="*.tsx"

# Tìm border-gray còn sót
grep -r "border-gray-[12]00" src/components src/pages --include="*.tsx"
```

Nếu file nào còn kết quả → thêm `dark:` prefix hoặc đổi sang CSS variable.

---

## Test checklist sau khi xong

- [ ] Toggle dark/light không bị flash (đảm bảo `localStorage` lưu preference)
- [ ] Reload trang vẫn giữ mode đã chọn
- [ ] Tất cả text đủ contrast (không bị chìm vào nền)
- [ ] Input, dropdown, modal đều đổi màu đúng
- [ ] Toast notification hiện đúng màu ở cả 2 mode
- [ ] Progress bar, badge trạng thái nhìn rõ ở dark mode
- [ ] Không có vùng nào còn trắng/xám sáng khi đang ở dark mode
- [ ] Scrollbar dark mode (nếu có custom)
ENDOFFILE