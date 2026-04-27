import { GoogleLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { Shield, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { toast } from '../components/feedback';
import { ThemeToggle } from '../components/theme';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (idToken: string) => {
      const { data } = await authApi.googleLogin(idToken);
      return data;
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      toast.success(`Xin chào, ${data.user.fullName}! 👋`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Tài khoản trẻ em không được đăng nhập tại đây.');
      } else {
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    },
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-white/10 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-400/20 blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-8 rounded-[2.5rem] bg-white p-8 shadow-2xl duration-700 dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-12">
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-6 rounded-3xl bg-violet-100 p-4 shadow-inner dark:bg-violet-950/60">
            <Shield className="h-12 w-12 text-violet-600 dark:text-violet-300" />
          </div>
          <h1 className="tracking-tight text-3xl font-bold text-gray-900">Family Guardian</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-gray-500 dark:text-slate-400">
            Quản lý và bảo vệ con em của bạn
            <br />
            trên không gian mạng an toàn hơn.
          </p>
        </div>

        <div className="w-full">
          <div className="mx-auto flex w-full max-w-sm justify-center">
            <GoogleLogin
              onSuccess={(resp) => loginMutation.mutate(resp.credential!)}
              onError={() => {
                toast.error('Không thể kết nối Google. Thử lại sau.');
                return '';
              }}
              text="signin_with"
              shape="rectangular"
              size="large"
              width="100%"
            />
          </div>
        </div>

        {loginMutation.isPending && (
          <div className="mb-6 mt-4 flex items-center justify-center gap-3 text-sm font-medium text-violet-600 animate-pulse dark:text-violet-300">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent dark:border-violet-300" />
            Đang xác thực thông tin...
          </div>
        )}

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
            <span className="bg-white px-4 dark:bg-slate-900">Tính năng hệ thống</span>
          </div>
        </div>

        <div className="mb-10 space-y-4">
          {[
            { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, text: 'Kiểm soát website theo thời gian thực' },
            { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, text: 'Theo dõi lịch sử truy cập của con' },
            { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, text: 'Gửi thông báo nhắc nhở tức thì' },
          ].map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-gray-100/50 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
            >
              {f.icon}
              <span className="font-medium">{f.text}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-slate-500">
          Hệ thống bảo mật cao dành riêng cho Phụ huynh
        </p>
      </div>
    </div>
  );
}
