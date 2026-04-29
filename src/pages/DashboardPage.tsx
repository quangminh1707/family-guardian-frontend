import { useQuery } from '@tanstack/react-query';
import { childrenApi } from '../api/children.api';
import ChildCard from '../components/children/ChildCard';
import AddChildModal from '../components/children/AddChildModal';
import { 
  Users, 
  Globe, 
  Activity, 
  Plus,
  ShieldCheck,
  Zap,
  LayoutGrid
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: children, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: () => childrenApi.getMyChildren().then(res => res.data),
  });

  const stats = [
    { 
      label: 'Tổng số con', 
      value: children?.length || 0, 
      icon: Users, 
      color: 'bg-blue-500',
      description: 'Tài khoản đang quản lý' 
    },
    { 
      label: 'Đang online', 
      value: children?.filter(c => c.isOnline).length || 0, 
      icon: Activity, 
      color: 'bg-green-500',
      description: 'Hoạt động hiện tại' 
    },
    { 
      label: 'Websites chi phối', 
      value: children?.reduce((acc, curr) => acc + (curr.activeWebsitesCount || 0), 0) || 0, 
      icon: Globe, 
      color: 'bg-violet-500',
      description: 'Tổng số rule cho phép' 
    },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand font-bold uppercase tracking-widest text-[10px]">
             <Zap className="w-3 h-3 fill-current" />
             Bảng điều khiển giám hộ
          </div>
          <h2 className="text-3xl font-extrabold text-tx-primary tracking-tight">
            Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-indigo-600">{user?.fullName?.split(' ')[0]}!</span>
          </h2>
          <p className="text-tx-secondary font-medium">Bạn đang quản lý {children?.length || 0} tài khoản trẻ em trong hệ thống.</p>
        </div>

        <AddChildModal />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="group relative bg-bg-surface p-6 rounded-[2rem] border border-border-base shadow-sm hover:shadow-xl transition-all duration-300">
            <div className={`absolute top-6 right-6 w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="space-y-4">
              <p className="text-sm font-bold text-tx-muted uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-tx-primary">{stat.value}</span>
                <span className="text-xs font-bold text-tx-muted">{stat.description}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Children List Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-bg-surface p-2 rounded-xl shadow-sm border border-border-base">
               <LayoutGrid className="w-5 h-5 text-tx-secondary" />
             </div>
             <h3 className="text-xl font-bold text-tx-primary tracking-tight">Danh sách trẻ em</h3>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-80 w-full rounded-[2.5rem]" />
            ))}
          </div>
        ) : children && children.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
            
            {/* Quick Add Card */}
             <AddChildModal>
                <button className="h-full min-h-[320px] rounded-[2.5rem] border-2 border-dashed border-border-subtle bg-bg-subtle/50 flex flex-col items-center justify-center gap-4 hover:border-brand/40 hover:bg-brand-subtle/30 transition-all group overflow-hidden relative">
                   <div className="w-16 h-16 rounded-3xl bg-bg-surface border border-border-base flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                     <Plus className="w-8 h-8 text-tx-muted group-hover:text-brand" />
                   </div>
                   <div className="text-center">
                     <p className="font-bold text-tx-primary">Thêm tài khoản mới</p>
                     <p className="text-xs text-tx-secondary mt-1">Gia nhập thêm thành viên</p>
                   </div>
                   <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/5 transition-colors" />
                </button>
             </AddChildModal>
          </div>
        ) : (
          <div className="bg-bg-surface rounded-[3rem] p-16 text-center border border-dashed border-border-subtle max-w-2xl mx-auto shadow-sm">
            <div className="w-24 h-24 bg-brand-subtle rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
              <ShieldCheck className="w-12 h-12 text-brand/40" />
            </div>
            <h4 className="text-2xl font-bold text-tx-primary">Chưa có tài khoản con nào</h4>
            <p className="text-tx-secondary mt-4 leading-relaxed max-w-sm mx-auto">
              Bắt đầu bảo vệ con em của bạn bằng cách thêm tài khoản Gmail đầu tiên vào hệ thống giám sát.
            </p>
            <div className="mt-10">
              <AddChildModal />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
