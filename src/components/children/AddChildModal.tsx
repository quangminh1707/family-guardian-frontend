import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
} from "../ui/dialog";
import { Button } from '../ui/button';
import { Shield, Plus, Mail, UserPlus } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { toast } from 'sonner';

interface AddChildModalProps {
  children?: React.ReactNode;
}

export default function AddChildModal({ children }: AddChildModalProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleLinkGoogle = async (idToken: string) => {
    try {
      await authApi.linkChildGoogle(idToken);
      toast.success('Đã liên kết tài khoản con thành công!');
      queryClient.invalidateQueries({ queryKey: ['children'] });
      setOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể liên kết tài khoản');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-2xl px-6 py-6 shadow-xl shadow-violet-200 h-auto gap-2">
            <Plus className="w-5 h-5" />
            <span className="font-bold uppercase tracking-tight">Thêm tài khoản con</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md !rounded-3xl p-0 overflow-hidden border shadow-2xl bg-white  ">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="bg-violet-100 p-2 rounded-xl">
              <UserPlus className="h-6 w-6 text-violet-600" />
            </div>
            Thêm tài khoản con
          </DialogTitle>
          <DialogDescription className="text-gray-500 mt-2">
            Chọn một trong các phương thức dưới đây để thêm tài khoản vào danh sách quản lý.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* Option 1: Google login */}
          <div className="bg-violet-50/50 rounded-3xl p-6 border border-violet-100 flex flex-col items-center gap-4 group hover:bg-violet-50 transition-colors">
            <div className="text-center space-y-1">
              <p className="font-bold text-violet-900 leading-none">Con đã có Gmail</p>
              <p className="text-xs text-violet-700/60 font-medium">Đăng nhập bằng tài khoản Google của con</p>
            </div>
            <div className="w-full flex justify-center mt-2">
              <GoogleLogin
                onSuccess={(resp) => handleLinkGoogle(resp.credential!)}
                onError={() => toast.error('Lỗi kết nối Google')}
                text="signin_with"
                shape="rectangular"
                width="280"
              />
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative bg-white px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">hoặc</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 rounded-2xl flex flex-col items-center gap-1 border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all group"
              onClick={() => window.open('https://accounts.google.com/signup', '_blank')}
            >
              <div className="flex items-center gap-2 text-gray-900 font-bold group-hover:text-violet-700 transition-colors">
                <Mail className="h-4 w-4" />
                <span>Đăng ký Gmail mới cho con</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium group-hover:text-violet-500 transition-colors px-4 text-center">Tạo tài khoản Google chính thức được bảo vệ bởi cha mẹ</span>
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" />
            Bảo mật & an toàn bởi Family Guardian
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
