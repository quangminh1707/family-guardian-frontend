// AdminPage.tsx

const AdminPage = () => {
  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-2 block">Quản trị hệ thống</span>
          <h2 className="text-4xl font-bold tracking-tight text-white leading-tight">Admin Dashboard</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-container rounded-full px-4 py-2 flex items-center gap-3 border border-outline-variant/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-on-surface-variant">System Status: Stable</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Stat Card 1 */}
        <div className="bg-surface-container-low p-6 rounded-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-on-surface-variant text-sm font-medium mb-1">Total Guardians</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">1,284</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-400">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+12% tháng này</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-8xl">shield_person</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-surface-container-low p-6 rounded-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-on-surface-variant text-sm font-medium mb-1">Total Children</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">3,492</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-sm">groups</span>
              <span>An toàn & Bảo mật</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-8xl">child_care</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-surface-container-low p-6 rounded-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-on-surface-variant text-sm font-medium mb-1">Active Now</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">856</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-secondary">
              <span className="material-symbols-outlined text-sm">sensors</span>
              <span>Đang trực tuyến</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-8xl">monitoring</span>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-surface-container-low p-6 rounded-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-on-surface-variant text-sm font-medium mb-1">Requests Today</p>
            <h3 className="text-3xl font-bold text-white tracking-tight">42</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-tertiary">
              <span className="material-symbols-outlined text-sm">pending_actions</span>
              <span>Chờ xử lý</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-8xl">notification_important</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8 border-b border-outline-variant/10 overflow-x-auto no-scrollbar">
        <div className="flex gap-10 min-w-max">
          <button className="pb-4 text-primary font-semibold border-b-2 border-primary-dim transition-all">Người dùng</button>
          <button className="pb-4 text-on-surface-variant font-medium hover:text-white transition-all">Lịch sử toàn hệ thống</button>
          <button className="pb-4 text-on-surface-variant font-medium hover:text-white transition-all">Cài đặt hệ thống</button>
        </div>
      </div>

      {/* User Data Table Section */}
      <section className="bg-surface-container rounded-3xl overflow-hidden shadow-[0_40px_40px_-15px_rgba(0,0,0,0.5)]">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input className="w-full bg-surface-variant border-none rounded-xl pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-on-surface-variant/50 outline-none text-white" placeholder="Tìm kiếm người dùng..." type="text"/>
          </div>
          <button className="bg-gradient-to-r from-primary-dim to-secondary px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">person_add</span>
            Thêm người dùng
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Người dùng</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Email</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Vai trò</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {/* Row 1 */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm text-on-surface-variant">#FG-8821</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
                      <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCb4qOk5KCCh1ZtIRTk_lUGOyILAKE-aJM0ibOmfwksg6ClTvdjgPy9H2JmNshrCmKgus-cnMzpF30wI6WTpMVk5gV2avqXkdrfbAw00OzmWLfeW4Qce8CpyCY0H4Dx-HmhlKVSRgFPWlvxkHiI6VgrQ3rXtfINeRoMaLl56P0bQ3YCLDbfSeOQtINF0aBfjUXJhNUloaY0Ujk9jUOZXXywUEM3s_kVHLXnjhUUgoXeQg6j1ARYTOz-rJNCXopJeP8Px6mDaq4YaoM" alt="User" />
                    </div>
                    <span className="text-sm font-semibold text-white">Nguyễn Văn An</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">an.nguyen@guardian.com</td>
                <td className="px-6 py-4">
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase">Guardian</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="w-10 h-5 bg-primary/20 rounded-full relative transition-colors border border-primary/30">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-lg"></div>
                    </button>
                    <span className="text-xs text-white">Hoạt động</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-on-surface-variant hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-lg">more_vert</span>
                  </button>
                </td>
              </tr>
              
              {/* Row 2 */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm text-on-surface-variant">#FG-7654</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
                      <img className="w-full h-full object-cover" src="https://ui-avatars.com/api/?name=Tran+Thi+Mai&background=random" alt="User" />
                    </div>
                    <span className="text-sm font-semibold text-white">Trần Thị Mai</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">mai.tran@guardian.com</td>
                <td className="px-6 py-4">
                  <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-3 py-1 rounded-full uppercase">Admin</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="w-10 h-5 bg-primary/20 rounded-full relative transition-colors border border-primary/30">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-lg"></div>
                    </button>
                    <span className="text-xs text-white">Hoạt động</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-on-surface-variant hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-lg">more_vert</span>
                  </button>
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-outline-variant/10 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">Hiển thị 2 trong số 1,284 người dùng</span>
          <div className="flex gap-2">
            <button className="p-2 bg-surface-variant rounded-lg text-on-surface-variant hover:text-white transition-all active:scale-90 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="p-2 bg-primary-dim text-white font-bold text-xs px-4 rounded-lg">1</button>
            <button className="p-2 bg-surface-variant rounded-lg text-on-surface-variant hover:text-white transition-all active:scale-90 px-4 text-xs font-bold">2</button>
            <button className="p-2 bg-surface-variant rounded-lg text-on-surface-variant hover:text-white transition-all active:scale-90 px-4 text-xs font-bold">3</button>
            <button className="p-2 bg-surface-variant rounded-lg text-on-surface-variant hover:text-white transition-all active:scale-90 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminPage
