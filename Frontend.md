# FRONTEND - Family Guardian
## React Vite + TypeScript — Hướng dẫn vibe code chi tiết

---

## 1. LUỒNG NGƯỜI DÙNG (ĐÚNG VỚI BACKEND)

```
[Trang /login]
  → Bố mẹ nhấn "Đăng nhập với Google"
  → Google popup → chọn tài khoản Google của BỐ MẸ
  → Lấy idToken → POST /api/auth/google-login
  → Nhận { accessToken, user: { fullName, avatarUrl, ... } }
  → Lưu vào Zustand store + localStorage
  → Redirect /dashboard

[Trang /dashboard]
  → Hiển thị avatar + tên bố mẹ lấy từ Google ở góc trên
  → Grid danh sách con (nếu chưa có → empty state)
  → Nút "Thêm tài khoản con":
      - "Đăng ký Gmail mới" → window.open("https://accounts.google.com/signup")
      - "Đã có Gmail" → Google Login popup → link tài khoản con → thêm vào danh sách

[Trang /children/:childId]
  → Thông tin con (ảnh Google, tên, email, online/offline)
  → Danh sách web được phép (dạng card)
  → Nút "Thêm web":
      - Nhập domain → nhấn "Kiểm tra" → hiện kết quả (có tồn tại? an toàn?)
      - Đặt time limit, khung giờ
      - Nhấn "Thêm vào danh sách"
  → Mỗi card web: hiển thị thời gian dùng hôm nay, progress bar
  → Tab "Lịch sử": bảng log truy cập
  → Tab "Thống kê": chart thời gian theo ngày
```

---

## 2. CÔNG NGHỆ & CÀI ĐẶT

```bash
npm create vite@latest family-guardian-frontend -- --template react-ts
cd family-guardian-frontend

# Core
npm install react-router-dom zustand @tanstack/react-query axios date-fns

# Google OAuth
npm install @react-oauth/google

# UI & Styling
npm install tailwindcss @tailwindcss/vite lucide-react sonner

# shadcn/ui setup
npx shadcn@latest init
# → style: New York
# → color: Violet
# → CSS variables: yes

npx shadcn@latest add button card input label badge dialog sheet tabs \
  table skeleton avatar dropdown-menu alert separator progress switch \
  select textarea popover tooltip

# Forms
npm install react-hook-form zod @hookform/resolvers

# Charts
npm install recharts

# Real-time
npm install @microsoft/signalr

# Table
npm install @tanstack/react-table
```

---

## 3. BIẾN MÔI TRƯỜNG (.env)

```env
VITE_API_BASE_URL=http://localhost:5247/api
VITE_SIGNALR_URL=http://localhost:5247/hubs/notifications
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 4. CẤU TRÚC THƯ MỤC

```
src/
├── api/
│   ├── axios.ts                    ← Axios instance + JWT interceptor
│   ├── auth.api.ts
│   ├── children.api.ts
│   ├── websites.api.ts
│   ├── logs.api.ts
│   ├── websiteCheck.api.ts
│   └── notifications.api.ts
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── children/
│   │   ├── ChildCard.tsx           ← card hiển thị 1 đứa con
│   │   ├── AddChildModal.tsx       ← modal thêm con (2 option)
│   │   └── OnlineBadge.tsx         ← badge online/offline
│   ├── websites/
│   │   ├── WebsiteCard.tsx         ← card 1 website được phép
│   │   ├── AddWebsiteModal.tsx     ← modal thêm web (có kiểm tra)
│   │   ├── EditWebsiteModal.tsx
│   │   ├── WebsiteCheckResult.tsx  ← component hiển thị kết quả check
│   │   └── UsageProgressBar.tsx    ← progress bar thời gian dùng
│   ├── logs/
│   │   ├── AccessLogTable.tsx
│   │   └── UsageHistoryChart.tsx
│   └── notifications/
│       ├── NotificationBell.tsx
│       └── SendNotificationModal.tsx
├── pages/
│   ├── LoginPage.tsx               ← trang đăng nhập Google (bố mẹ)
│   ├── DashboardPage.tsx           ← trang chính: danh sách con
│   ├── ChildDetailPage.tsx         ← trang quản lý 1 con (3 tab)
│   └── NotificationsPage.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useSignalR.ts
│   └── useHeartbeat.ts
├── store/
│   ├── authStore.ts                ← Zustand: user + tokens
│   └── notificationStore.ts
├── types/
│   ├── user.types.ts
│   ├── website.types.ts
│   ├── log.types.ts
│   └── notification.types.ts
├── lib/
│   ├── utils.ts                    ← cn() từ shadcn
│   ├── formatters.ts               ← format seconds, dates
│   └── domainHelper.ts             ← normalize domain
├── App.tsx
└── main.tsx
```

---

## 5. MAIN.TSX

```tsx
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster richColors position="top-right" expand={false} />
    </QueryClientProvider>
  </GoogleOAuthProvider>
);
```

---

## 6. AXIOS INSTANCE (api/axios.ts)

```typescript
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Thêm JWT vào mọi request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tự động refresh khi 401
let isRefreshing = false;
let queue: Array<{ resolve: Function; reject: Function }> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then((token) => { original.headers.Authorization = `Bearer ${token}`; return api(original); });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const rt = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken: rt });
        useAuthStore.getState().updateToken(data.accessToken, data.refreshToken);
        queue.forEach((p) => p.resolve(data.accessToken));
        queue = [];
        return api(original);
      } catch {
        queue.forEach((p) => p.reject());
        queue = [];
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 7. ZUSTAND STORES

### authStore.ts
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;   // URL avatar từ Google
  role: 'Admin' | 'Guardian' | 'Child';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateToken: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateToken: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
    }),
    { name: 'fg-auth' }
  )
);
```

---

## 8. TYPES

### website.types.ts
```typescript
export interface AllowedWebsite {
  id: number;
  domain: string;
  displayName?: string;
  faviconUrl?: string;
  isActive: boolean;
  timeLimitMinutes?: number;
  allowedStartTime?: string;  // "07:00"
  allowedEndTime?: string;    // "21:00"
  isVerified: boolean;
  isSafe?: boolean;
  httpStatusCode?: number;
  lastCheckedAt?: string;
  todaySeconds: number;
  todayRequests: number;
  limitExceeded: boolean;
}

export interface AddWebsiteRequest {
  domain: string;
  timeLimitMinutes?: number;
  allowedStartTime?: string;
  allowedEndTime?: string;
}

export interface WebsiteCheckResult {
  domain: string;
  isReachable: boolean;
  httpStatusCode?: number;
  responseTimeMs?: number;
  isSafe: boolean;
  threatType?: string;
  faviconUrl?: string;
  checkedAt: string;
}
```

---

## 9. APP.TSX — ROUTING

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSignalR } from './hooks/useSignalR';
import { useHeartbeat } from './hooks/useHeartbeat';

function AuthenticatedApp() {
  useSignalR();
  useHeartbeat();
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/children/:childId" element={<ChildDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />
        <Route path="/*" element={
          isAuthenticated ? <AuthenticatedApp /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 10. TRANG LOGIN (/login)

### Giao diện chi tiết:
- **Nền:** `bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700` — gradient tím/xanh đậm full screen.
- **Card trung tâm:** `bg-white rounded-3xl shadow-2xl` — bo tròn nhiều, bóng đổ lớn, max-w-md, căn giữa tuyệt đối.
- **Hiệu ứng:** Card có `backdrop-blur` nhẹ, animate fade-in từ dưới lên khi load.

### Layout trong card (từ trên xuống):
1. **Logo:** Icon shield (`<Shield />` từ lucide-react, màu violet-600, size 48px) + text "Family Guardian" bold 28px.
2. **Đường kẻ phân cách mỏng.**
3. **Tiêu đề:** "Chào mừng trở lại" — font-bold text-2xl text-gray-900.
4. **Mô tả:** "Đăng nhập để quản lý và bảo vệ con em của bạn" — text-sm text-gray-500, căn giữa.
5. **Nút Google Login** (từ `@react-oauth/google`, width đầy đủ, size large).
6. **Divider** với text "hoặc" ở giữa.
7. **Feature list nhỏ:**
   - 🛡️ Kiểm soát website theo thời gian
   - 👁️ Theo dõi lịch sử truy cập
   - 🔔 Gửi thông báo nhắc nhở
8. **Footer text:** "Chỉ dành cho phụ huynh và người giám hộ" — text-xs text-gray-400 căn giữa.

### Code LoginPage.tsx:
```tsx
import { GoogleLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (idToken: string) => {
      const { data } = await api.post('/auth/google-login', { idToken });
      return data;
    },
    onSuccess: (data) => {
      // data.user.avatarUrl chứa URL avatar từ Google
      login(data.user, data.accessToken, data.refreshToken);
      toast.success(`Xin chào, ${data.user.fullName}! 👋`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      if (error.response?.status === 403)
        toast.error('Tài khoản trẻ em không được đăng nhập tại đây.');
      else
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-violet-100 p-4 rounded-2xl mb-4">
            <Shield className="h-12 w-12 text-violet-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Family Guardian</h1>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Quản lý và bảo vệ con em của bạn trên không gian mạng
          </p>
        </div>

        {/* Google Login */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={(resp) => loginMutation.mutate(resp.credential!)}
            onError={() => toast.error('Không thể kết nối Google. Thử lại sau.')}
            text="signin_with"
            shape="rectangular"
            locale="vi"
            size="large"
            width="320"
          />
        </div>

        {loginMutation.isPending && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-4">
            <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            Đang xác thực...
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400">
            <span className="bg-white px-3">Tính năng nổi bật</span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          {[
            { icon: '🛡️', text: 'Kiểm soát website theo thời gian thực' },
            { icon: '👁️', text: 'Theo dõi lịch sử truy cập của con' },
            { icon: '🔔', text: 'Gửi thông báo nhắc nhở tức thì' },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 text-sm text-gray-600">
              <span className="text-lg">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Chỉ dành cho phụ huynh và người giám hộ
        </p>
      </div>
    </div>
  );
}
```

---

## 11. LAYOUT (components/layout/)

### AppLayout.tsx
```
Layout: 2 cột
├── Sidebar (w-64, cố định bên trái, bg-gray-900 text-white)
│   ├── Logo: Shield icon + "Family Guardian" (text-white)
│   ├── Navigation links:
│   │   - 🏠 Tổng quan (/dashboard) — active: bg-violet-600
│   │   - 🔔 Thông báo (/notifications)
│   ├── Spacer
│   └── User info: Avatar bố/mẹ + tên + nút logout
└── Main content (flex-1, bg-gray-50, overflow-y-auto)
    └── Topbar (bg-white border-b shadow-sm)
        ├── Breadcrumb (path hiện tại)
        ├── NotificationBell icon (badge đỏ số chưa đọc)
        └── Avatar bố/mẹ (img src={user.avatarUrl}) + dropdown
            - Tên + email
            - Đăng xuất
```

**Topbar avatar:** dùng `<img src={user?.avatarUrl} className="w-9 h-9 rounded-full" />` — hiển thị ảnh Google thật của bố mẹ.

### Sidebar.tsx — Mobile responsive:
- Desktop (lg): sidebar cố định bên trái
- Mobile: ẩn sidebar, hiện hamburger → mở Sheet (drawer) từ trái

---

## 12. TRANG DASHBOARD (/dashboard)

### Giao diện tổng thể:
- **Topbar:** Hiển thị `<img src={user.avatarUrl} />` + "Xin chào, {user.fullName}" ở góc phải.
- **Nền trang:** `bg-gray-50`.
- **Padding:** `p-6` hoặc `p-8`.

### Phần 1 — Header trang:
```
[Shield icon, tím] Tổng quan
Quản lý tài khoản con và cài đặt kiểm soát truy cập

                              [Nút "Thêm tài khoản con" — bg-violet-600 text-white rounded-xl]
```

### Phần 2 — Stats cards (3 card ngang):
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 👨‍👩‍👧‍👦 Tổng số con  │ │ 🟢 Đang online  │ │ 🌐 Web đã thêm  │
│                 │ │                 │ │                 │
│      [số]       │ │    [số]/[tổng]  │ │   [tổng số]     │
│  tài khoản con  │ │  đang hoạt động │ │  website        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```
- Card: `bg-white rounded-2xl shadow-sm border border-gray-100 p-6`
- Số liệu: `text-3xl font-bold text-gray-900`

### Phần 3 — Danh sách con:

**Khi chưa có con (empty state):**
```
    [Illustration: người + dấu + icon]
    Chưa có tài khoản con nào
    Thêm tài khoản con để bắt đầu quản lý

    [Nút "Thêm tài khoản con ngay"]
```
- Card trung tâm, nền trắng, padding lớn, text gray

**Khi có con — grid 3 cột (responsive: 1→2→3):**

**ChildCard component:**
```
┌──────────────────────────────────────────┐
│  [Avatar img Google hoặc initials]  [🟢 Online / ⚫ Offline]  │
│                                          │
│  Nguyen An                               │
│  an@gmail.com                            │
│  └─ Last seen: 5 phút trước             │
│                                          │
│  ────────────────────────────────────    │
│  🌐 3 website  │  ⏱️ 1h 20m hôm nay     │
│                                          │
│  [Nút "Quản lý →" — full width, violet] │
└──────────────────────────────────────────┘
```
- Card: `bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer`
- Avatar: `<img src={child.avatarUrl} className="w-14 h-14 rounded-full" />` hoặc nếu không có → initials với `bg-violet-100 text-violet-600`
- Online badge: `w-3 h-3 rounded-full` — xanh lá `bg-green-400` nếu online, xám `bg-gray-300` nếu offline
- Click card → `navigate(`/children/${child.id}`)`

### AddChildModal component:

**Trigger:** Nút "Thêm tài khoản con" → mở Dialog.

**Layout dialog:**
```
┌─────────────────────────────────────────┐
│  Thêm tài khoản con              [✕]   │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   [Icon Google]                   │  │
│  │   Liên kết tài khoản Google của con │
│  │   Con đã có Gmail → đăng nhập vào │
│  │   hệ thống này                    │
│  │                                   │
│  │   [Nút Google Login — lớn]        │  ← GoogleLogin component của @react-oauth/google
│  └───────────────────────────────────┘  │
│                                         │
│           ──── hoặc ────                │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Con chưa có Gmail?              │  │
│  │   Tạo tài khoản Google mới cho con│  │
│  │   [Nút "Tạo Gmail mới"] — outline │  ← window.open("https://accounts.google.com/signup")
│  └───────────────────────────────────┘  │
│                                         │
│  Hoặc tạo tài khoản thủ công:          │
│  [Email] [Tên con]                      │
│  [Nút "Tạo tài khoản"]                 │
└─────────────────────────────────────────┘
```

**Logic:**
```typescript
// Option 1: Google Login
<GoogleLogin
  onSuccess={async (resp) => {
    await api.post('/auth/link-child-google', { idToken: resp.credential });
    toast.success('Đã liên kết tài khoản con thành công!');
    queryClient.invalidateQueries({ queryKey: ['children'] });
    setOpen(false);
  }}
  onError={() => toast.error('Không thể đăng nhập Google')}
  text="signin_with"
/>

// Option 2: Tạo Gmail mới
<Button variant="outline" onClick={() => window.open('https://accounts.google.com/signup', '_blank')}>
  <ExternalLink className="w-4 h-4 mr-2" />
  Tạo Gmail mới cho con
</Button>

// Option 3: Tạo thủ công
// Form: email + fullName → POST /auth/create-child-manual (nếu có backend)
```

---

## 13. TRANG QUẢN LÝ CON (/children/:childId)

### Header trang:
```
[← Quay lại]

[Avatar con - ảnh Google, 64px, rounded-full]
Nguyen An
an@gmail.com
[🟢 Đang online | ⚫ Offline - 5 phút trước]

                    [Nút "Gửi thông báo" — outline]
```

### 3 Tabs:
```
[🌐 Website được phép]  [📋 Lịch sử truy cập]  [📊 Thống kê]
```

---

#### TAB 1: "Website được phép"

**Toolbar:**
```
Danh sách website con được phép truy cập    [Nút "+ Thêm website" — bg-violet-600]
Chỉ những website trong danh sách này mới có thể truy cập.
```

**Danh sách WebsiteCard — grid 2 cột:**

```
┌─────────────────────────────────────────────────┐
│  [Favicon 32px]  YouTube                [Toggle ✅]│
│                  youtube.com                       │
│                                                    │
│  ── Hôm nay: ─────────────────────────────────    │
│  [████████░░░░░░] 45/60 phút (75%)                │
│  15 lần truy cập                                  │
│                                                    │
│  ⏰ 07:00 - 21:00    ⏱️ Giới hạn 60 phút/ngày    │
│  ✅ Đang hoạt động   ✅ An toàn                   │
│                                                    │
│  [Nút Sửa ✏️]  [Nút Kiểm tra lại 🔄]  [Xóa 🗑️]  │
└─────────────────────────────────────────────────┘
```

- Card: `bg-white rounded-2xl border border-gray-100 shadow-sm p-5`
- Progress bar: `bg-violet-100` nền, `bg-violet-600` fill. Nếu vượt giới hạn → `bg-red-500`
- Toggle (Switch component từ shadcn): bật/tắt is_active → PATCH /toggle
- Badge "✅ An toàn": `bg-green-100 text-green-700` / "⚠️ Không an toàn": `bg-red-100 text-red-700`
- Badge HTTP status: `bg-gray-100 text-gray-600`

**Khi danh sách rỗng (empty state):**
```
  🌐
  Chưa có website nào được cho phép
  Tất cả website đang bị chặn. Thêm website để con có thể truy cập.

  [+ Thêm website đầu tiên]
```

---

### AddWebsiteModal — chi tiết giao diện:

**Header:** "Thêm website cho phép"

**Step 1 — Nhập và kiểm tra domain:**
```
┌──────────────────────────────────────────────┐
│ Địa chỉ website                              │
│ [Input: vd: youtube.com         ] [Kiểm tra]│
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Kết quả kiểm tra:                        │ │
│ │                                          │ │
│ │  [Favicon] youtube.com                   │ │
│ │  ✅ Đang hoạt động (200 OK, 234ms)       │ │
│ │  ✅ An toàn (Google Safe Browsing)       │ │
│ │                                          │ │
│ │  hoặc:                                   │ │
│ │  ❌ Không thể truy cập (404)             │ │
│ │  ⚠️ Cảnh báo: Trang web độc hại!        │ │
│ │     Loại: MALWARE                        │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```
- Input: `placeholder="youtube.com hoặc dán link đầy đủ"`
- Khi nhấn "Kiểm tra" → gọi GET `/api/website-check?domain=xxx` → hiện loading spinner
- Kết quả hiện trong box dưới với màu tương ứng

**Step 2 — Cài đặt thêm (sau khi check thành công):**
```
┌──────────────────────────────────────────────┐
│ Giới hạn thời gian mỗi ngày                  │
│ ○ Không giới hạn                             │
│ ● Giới hạn: [  60  ] phút/ngày              │
│                                              │
│ Khung giờ cho phép (tùy chọn)               │
│ ☐ Đặt khung giờ                             │
│   Từ [07:00] Đến [21:00]                    │
│                                              │
│             [Hủy]  [Thêm vào danh sách]     │
└──────────────────────────────────────────────┘
```
- Nút "Thêm vào danh sách": `disabled` nếu domain chưa được kiểm tra, hoặc nếu website độc hại (isSafe = false) → hiện warning nhưng vẫn cho thêm (guardian quyết định)

**Logic AddWebsiteModal.tsx:**
```typescript
const [domain, setDomain] = useState('');
const [checkResult, setCheckResult] = useState<WebsiteCheckResult | null>(null);
const [isChecking, setIsChecking] = useState(false);
const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
const [scheduleEnabled, setScheduleEnabled] = useState(false);
const [startTime, setStartTime] = useState('07:00');
const [endTime, setEndTime] = useState('21:00');

const handleCheck = async () => {
  setIsChecking(true);
  try {
    const { data } = await api.get(`/website-check`, { params: { domain } });
    setCheckResult(data);
  } catch {
    toast.error('Không thể kiểm tra website');
  } finally {
    setIsChecking(false);
  }
};

const handleAdd = async () => {
  await api.post(`/children/${childId}/websites`, {
    domain,
    timeLimitMinutes: timeLimitEnabled ? timeLimitMinutes : undefined,
    allowedStartTime: scheduleEnabled ? startTime : undefined,
    allowedEndTime: scheduleEnabled ? endTime : undefined,
  });
  toast.success('Đã thêm website thành công!');
  queryClient.invalidateQueries({ queryKey: ['websites', childId] });
  setOpen(false);
};
```

**WebsiteCheckResult component:**
```typescript
// Hiển thị kết quả kiểm tra với animation fade-in
// Loading: spinner + "Đang kiểm tra..."
// Success reachable + safe: green box với checkmark
// Success reachable + unsafe: yellow/red warning box
// Fail: red box với X icon
// Hiện: domain, favicon, status code, response time, safe status
```

---

#### TAB 2: "Lịch sử truy cập"

**Bộ lọc (hàng ngang):**
```
[Từ ngày: DatePicker] [Đến ngày: DatePicker] [Domain: Input] [Trạng thái: Select ▾] [Làm mới]
```

**AccessLogTable:**
- Dùng TanStack Table
- Columns:

| Thời gian | Website | URL | Kết quả | Thời lượng |
|---|---|---|---|---|
| 14:30:25 | [favicon] YouTube | youtube.com/watch?v=... | 🟢 Cho phép | 5 phút |
| 14:28:10 | tiktok.com | tiktok.com/... | 🔴 Bị chặn | - |

- Badge "Cho phép": `bg-green-100 text-green-700 rounded-full px-2 py-0.5`
- Badge "Bị chặn": `bg-red-100 text-red-700 rounded-full px-2 py-0.5`
- URL truncate nếu quá dài (max 50 chars + `...`)
- Phân trang: `Hiển thị 1-20 / 150 kết quả` + Previous/Next buttons
- Nút Export CSV: tạo Blob CSV và download

---

#### TAB 3: "Thống kê"

**DatePicker chọn ngày** + nút "Hôm nay" / "Hôm qua" / "7 ngày qua"

**DailyUsageChart (Recharts):**
```typescript
// HorizontalBarChart
// Data: mỗi row = 1 website, value = totalSeconds
// Colors:
//   - Bình thường: #7c3aed (violet-700)
//   - Vượt giới hạn: #ef4444 (red-500)
// Custom tooltip: "YouTube — 1 giờ 30 phút (giới hạn: 2 giờ)"
// Custom label: tên website + favicon ở trục Y
// Animate bars từ trái sang khi render
```

**Bảng chi tiết bên dưới chart:**
```
| Website | Favicon | Hôm nay | Giới hạn | Tiến độ | Số lần |
|---------|---------|---------|----------|---------|--------|
| YouTube | [img] | 1h 30m | 2h | [██████░░] 75% | 15 lần |
| Google  | [img] | 45 phút | Không giới hạn | — | 8 lần |
```

**Card tổng hợp 7 ngày (LineChart):**
```typescript
// X axis: ngày (01/01, 02/01, ...)
// Y axis: tổng giây → format thành giờ
// Multiple lines: mỗi line = 1 website
// Legend bên dưới
```

---

## 14. HOOKS

### useSignalR.ts
```typescript
import * as signalR from '@microsoft/signalr';

export function useSignalR() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_SIGNALR_URL, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    // Child status thay đổi → cập nhật list con
    connection.on('ChildStatusChanged', ({ userId, isOnline, lastSeenAt }) => {
      queryClient.setQueryData<any[]>(['children'], (old) =>
        old?.map((c) => c.id === userId ? { ...c, isOnline, lastSeenAt } : c)
      );
    });

    // Thông báo mới (dành cho child)
    connection.on('ReceiveNotification', (n) => {
      toast.info(n.title, { description: n.message });
      useNotificationStore.getState().add(n);
    });

    connection.start().catch((err) => console.warn('SignalR error:', err));
    return () => { connection.stop(); };
  }, [isAuthenticated, accessToken]);
}
```

### useHeartbeat.ts
```typescript
export function useHeartbeat() {
  const { isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated) return;
    const ping = () => api.post('/online-status/heartbeat').catch(() => {});
    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  }, [isAuthenticated]);
}
```

---

## 15. LIB/FORMATTERS.TS

```typescript
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date(dateStr));
}

export function formatUsagePercent(seconds: number, limitMinutes?: number): number | null {
  if (!limitMinutes) return null;
  return Math.min(100, Math.round((seconds / (limitMinutes * 60)) * 100));
}
```

---

## 16. MÀU SẮC & DESIGN SYSTEM

| Yếu tố | Class Tailwind | Màu |
|---|---|---|
| Primary (buttons, active) | `bg-violet-600` | Tím đậm |
| Primary hover | `hover:bg-violet-700` | Tím tối hơn |
| Background | `bg-gray-50` | Xám rất nhạt |
| Card | `bg-white border border-gray-100` | Trắng |
| Text chính | `text-gray-900` | Gần đen |
| Text phụ | `text-gray-500` | Xám |
| Online badge | `bg-green-400` | Xanh lá |
| Offline badge | `bg-gray-300` | Xám |
| Allowed | `bg-green-100 text-green-700` | Xanh nhạt |
| Blocked | `bg-red-100 text-red-700` | Đỏ nhạt |
| Safe | `bg-green-100 text-green-700` | Xanh nhạt |
| Unsafe | `bg-red-100 text-red-700` | Đỏ nhạt |
| Sidebar | `bg-gray-900 text-white` | Đen |
| Active nav | `bg-violet-600` | Tím |

---

## 17. CÁCH HIỂN THỊ AVATAR GOOGLE

```typescript
// Trong Topbar và card bố mẹ:
const { user } = useAuthStore();

{user?.avatarUrl ? (
  <img
    src={user.avatarUrl}
    alt={user.fullName}
    className="w-9 h-9 rounded-full ring-2 ring-violet-200 object-cover"
    referrerPolicy="no-referrer"  // QUAN TRỌNG: cần để hiển thị ảnh Google
  />
) : (
  <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-semibold text-sm">
    {user?.fullName?.charAt(0).toUpperCase()}
  </div>
)}
```

**Lưu ý:** phải có `referrerPolicy="no-referrer"` khi hiển thị ảnh từ `lh3.googleusercontent.com`, nếu không ảnh sẽ bị block.

---

## 18. CHECKLIST HOÀN THÀNH

**Setup:**
- [ ] Tạo project Vite + React + TypeScript
- [ ] Cài npm packages
- [ ] Cấu hình Tailwind CSS + shadcn/ui
- [ ] Tạo `.env` với 3 biến
- [ ] Cấu hình `main.tsx`

**Core:**
- [ ] Axios instance với interceptors (auto refresh)
- [ ] authStore (Zustand + persist)
- [ ] notificationStore (Zustand)

**LoginPage:**
- [ ] Layout gradient tím-xanh
- [ ] Card trung tâm với GoogleLogin component
- [ ] Xử lý login → lưu user.avatarUrl → redirect dashboard
- [ ] Xử lý lỗi 403

**AppLayout:**
- [ ] Sidebar dark (bg-gray-900) với navigation
- [ ] Topbar hiển thị avatar Google (`referrerPolicy="no-referrer"`)
- [ ] Responsive mobile (Sheet drawer)

**DashboardPage:**
- [ ] Stats cards (số con, online, website)
- [ ] ChildCard (avatar, tên, email, online badge, thống kê nhanh)
- [ ] Empty state khi chưa có con
- [ ] AddChildModal (Google Login + window.open tạo Gmail + thủ công)

**ChildDetailPage:**
- [ ] Header con (avatar Google, tên, online status)
- [ ] Tab "Website được phép"
  - [ ] Grid WebsiteCard (favicon, tên, progress bar usage, toggle, actions)
  - [ ] Empty state
  - [ ] AddWebsiteModal (input → check → kết quả → time limit → thêm)
  - [ ] WebsiteCheckResult component
  - [ ] EditWebsiteModal
- [ ] Tab "Lịch sử truy cập"
  - [ ] Filter (date range, domain, status)
  - [ ] AccessLogTable (phân trang)
  - [ ] Export CSV
- [ ] Tab "Thống kê"
  - [ ] DatePicker
  - [ ] HorizontalBarChart (Recharts)
  - [ ] Bảng chi tiết
  - [ ] LineChart 7 ngày

**Real-time:**
- [ ] useSignalR (ChildStatusChanged cập nhật online badge)
- [ ] useHeartbeat (POST /heartbeat mỗi 30s)

**Formatters:**
- [ ] formatDuration
- [ ] formatRelativeTime
- [ ] formatDateTime
- [ ] formatUsagePercent
