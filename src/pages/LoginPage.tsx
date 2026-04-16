import { GoogleLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { Shield, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

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
      if (error.response?.status === 403)
        toast.error('Tài khoản trẻ em không được đăng nhập tại đây.');
      else
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="relative bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="bg-violet-100 p-4 rounded-3xl mb-6 shadow-inner">
            <Shield className="h-12 w-12 text-violet-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Family Guardian</h1>
          <p className="text-gray-500 text-sm mt-3 text-center leading-relaxed">
            Quản lý và bảo vệ con em của bạn<br />trên không gian mạng an toàn hơn.
          </p>
        </div>

        {/* Google Login */}
             <GoogleLogin
                onSuccess={(resp) => loginMutation.mutate(resp.credential!)}
                onError={() => {
                  toast.error('Không thể kết nối Google. Thử lại sau.');
                  return '';
                }}
                text="signin_with"
                shape="rectangular"
                size="large"
                width="320"
              />

        {loginMutation.isPending && (
          <div className="flex items-center justify-center gap-3 text-sm text-violet-600 font-medium mb-6 animate-pulse">
            <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            Đang xác thực thông tin...
          </div>
        )}

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            <span className="bg-white px-4">Tính năng hệ thống</span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-10">
          {[
            { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, text: 'Kiểm soát website theo thời gian thực' },
            { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, text: 'Theo dõi lịch sử truy cập của con' },
            { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, text: 'Gửi thông báo nhắc nhở tức thì' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl text-sm text-gray-700 border border-gray-100/50">
              {f.icon}
              <span className="font-medium">{f.text}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400">
          Hệ thống bảo mật cao dành riêng cho Phụ huynh
        </p>
      </div>
    </div>
  );
}
