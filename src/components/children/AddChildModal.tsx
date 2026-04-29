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
import { toast } from '../feedback';

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
          <Button className="bg-brand hover:bg-brand-hover text-white rounded-2xl px-6 py-6 shadow-xl shadow-brand/20 h-auto gap-2">
            <Plus className="w-5 h-5" />
            <span className="font-bold uppercase tracking-tight">Thêm tài khoản con</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md !rounded-3xl p-0 overflow-hidden border border-border-base shadow-2xl bg-bg-surface text-tx-primary">
        <DialogHeader className="border-b border-border-base bg-gradient-to-r from-bg-subtle/50 to-bg-surface p-8 pb-6 text-left">
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
            <div className="bg-brand/10 p-2 rounded-xl ring-1 ring-brand/20">
              <UserPlus className="h-6 w-6 text-brand" />
            </div>
            Thêm tài khoản con
          </DialogTitle>
          <DialogDescription className="text-tx-secondary mt-2 font-medium">
            Chọn một trong các phương thức dưới đây để thêm tài khoản vào danh sách quản lý.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* Option 1: Google login */}
          <div className="bg-brand-subtle rounded-3xl p-6 border border-brand/10 flex flex-col items-center gap-4 group hover:bg-brand-subtle/80 transition-colors">
            <div className="text-center space-y-1">
              <p className="font-bold text-tx-primary leading-none">Con đã có Gmail</p>
              <p className="text-xs text-tx-muted font-medium">Đăng nhập bằng tài khoản Google của con</p>
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
              <div className="w-full border-t border-border-base"></div>
            </div>
            <span className="relative bg-bg-surface px-4 text-[10px] font-bold text-tx-muted uppercase tracking-[0.2em]">hoặc</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 rounded-2xl flex flex-col items-center gap-1 border-border-base hover:border-brand/30 hover:bg-brand-subtle transition-all group"
              onClick={() => window.open('https://accounts.google.com/signup', '_blank')}
            >
              <div className="flex items-center gap-2 text-tx-primary font-bold group-hover:text-brand transition-colors">
                <Mail className="h-4 w-4" />
                <span>Đăng ký Gmail mới cho con</span>
              </div>
              <span className="text-[10px] text-tx-muted font-medium group-hover:text-brand transition-colors px-4 text-center">Tạo tài khoản Google chính thức được bảo vệ bởi cha mẹ</span>
            </Button>
          </div>
        </div>

        <div className="bg-bg-subtle p-4 text-center border-t border-border-base">
          <p className="text-[10px] text-tx-muted font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" />
            Bảo mật & an toàn bởi Family Guardian
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
