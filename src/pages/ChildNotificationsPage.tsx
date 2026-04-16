const ChildNotificationsPage = () => {
  return (
    <div className="max-w-md mx-auto pt-4 pb-20 px-4 animate-in fade-in duration-500">
      {/* Welcome Hero Segment */}
      <section className="mb-8 mt-4">
        <div className="bg-surface-container-low rounded-3xl p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-3xl font-semibold text-white mb-2 leading-tight">Chào buổi sáng, Nam!</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">Bạn có 3 lời nhắc mới cho ngày hôm nay. Hãy cùng hoàn thành nhé!</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        </div>
      </section>

      {/* Notifications List */}
      <div className="space-y-4">
        {/* Notification Item: Warning (Unread) */}
        <div className="bg-surface-container-highest rounded-2xl p-5 relative overflow-hidden transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error" style={{fontVariationSettings: "'FILL' 1"}}>warning</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-white leading-tight">Sắp hết thời gian dùng máy</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">2 phút trước</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">Chỉ còn 5 phút nữa là đến giờ nghỉ ngơi rồi. Hãy lưu lại việc đang làm nhé!</p>
            </div>
          </div>
        </div>

        {/* Notification Item: Reminder (Unread) */}
        <div className="bg-surface-container-highest rounded-2xl p-5 relative overflow-hidden transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>event_repeat</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-white leading-tight">Giờ làm bài tập về nhà</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">15 phút trước</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">Đã đến giờ ôn lại bài tập rồi. Cố gắng lên nhé!</p>
            </div>
          </div>
        </div>

        {/* Notification Item: Info (Unread) */}
        <div className="bg-surface-container-highest rounded-2xl p-5 relative overflow-hidden transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-white leading-tight">Bố mẹ đã xem báo cáo</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">1 giờ trước</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">Bố mẹ rất vui vì bạn đã hoàn thành mục tiêu ngày hôm qua.</p>
            </div>
          </div>
        </div>

        {/* Read Section Header */}
        <div className="pt-6 pb-2">
          <h4 className="text-xs text-on-surface-variant tracking-[0.2em] font-bold">ĐÃ XEM</h4>
        </div>

        {/* Notification Item: Generic (Read) */}
        <div className="bg-surface-container-low rounded-2xl p-5 opacity-60">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">task_alt</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-white leading-tight">Hoàn thành thử thách tuần</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Hôm qua</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">Bạn đã đạt được huy hiệu "Người Chăm Chỉ"!</p>
            </div>
          </div>
        </div>
        
        {/* Empty Space at bottom for aesthetic breathing */}
        <div className="h-10"></div>
      </div>
    </div>
  )
}

export default ChildNotificationsPage
