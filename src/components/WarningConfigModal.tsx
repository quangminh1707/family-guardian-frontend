import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Save, Trash2, ShieldCheck, Clock, Bell, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { warningConfigApi } from '../api/warningConfig.api';

interface Props {
  childId: number;
  childName: string;
  websites: { id: number; domain: string; timeLimitMinutes?: number | null }[];
  onClose: () => void;
}

export default function WarningConfigModal({ childId, childName, websites, onClose }: Props) {
  const queryClient = useQueryClient();
  const validWebsites = websites.filter((w) => w.timeLimitMinutes && w.timeLimitMinutes > 0);

  const [selectedWebsites, setSelectedWebsites] = useState<number[]>([]);
  const [threshold1Percent, setThreshold1Percent] = useState(80);
  const [threshold1Message, setThreshold1Message] = useState('');
  const [useThreshold2, setUseThreshold2] = useState(false);
  const [threshold2Percent, setThreshold2Percent] = useState(90);
  const [threshold2Message, setThreshold2Message] = useState('');

  // Fetch configs
  const { data: configs, isLoading } = useQuery({
    queryKey: ['warning-configs', childId],
    queryFn: () => warningConfigApi.getByChild(childId).then((res) => res.data),
  });

  // Load config if 1 website is selected
  useEffect(() => {
    if (selectedWebsites.length === 1 && configs) {
      const existing = configs.find((c) => c.allowedWebsiteId === selectedWebsites[0]);
      if (existing) {
        setThreshold1Percent(existing.threshold1Percent);
        setThreshold1Message(existing.threshold1Message);
        if (existing.threshold2Percent) {
          setUseThreshold2(true);
          setThreshold2Percent(existing.threshold2Percent);
          setThreshold2Message(existing.threshold2Message || '');
        } else {
          setUseThreshold2(false);
          setThreshold2Percent(existing.threshold1Percent + 5);
          setThreshold2Message('');
        }
      }
    }
  }, [selectedWebsites, configs]);

  const upsertMutation = useMutation({
    mutationFn: warningConfigApi.upsert,
    onSuccess: () => {
      toast.success('Đã lưu cấu hình cảnh báo!');
      queryClient.invalidateQueries({ queryKey: ['warning-configs', childId] });
      // Reset after save if we want, or close modal
      // onClose(); 
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu cấu hình');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: warningConfigApi.delete,
    onSuccess: () => {
      toast.success('Đã xóa cấu hình');
      queryClient.invalidateQueries({ queryKey: ['warning-configs', childId] });
    },
  });

  const toggleWebsite = (id: number) => {
    setSelectedWebsites((prev) =>
      prev.includes(id) ? prev.filter((wId) => wId !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (selectedWebsites.length === 0) return toast.error('Vui lòng chọn ít nhất 1 website');
    if (!threshold1Message.trim()) return toast.error('Vui lòng nhập nội dung mốc 1');
    if (useThreshold2) {
      if (threshold2Percent <= threshold1Percent) return toast.error('Mốc 2 phải lớn hơn mốc 1');
      if (!threshold2Message.trim()) return toast.error('Vui lòng nhập nội dung mốc 2');
    }

    upsertMutation.mutate({
      allowedWebsiteIds: selectedWebsites,
      threshold1Percent,
      threshold1Message,
      threshold2Percent: useThreshold2 ? threshold2Percent : null,
      threshold2Message: useThreshold2 ? threshold2Message : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase">Cấu hình cảnh báo</h2>
              <p className="text-sm font-medium text-gray-500">Cho tài khoản: {childName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Step 1 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">1</span>
                Chọn website
              </h3>
              
              {validWebsites.length === 0 ? (
                <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl text-sm font-medium border border-orange-100 flex gap-2 items-start">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  Con chưa có website nào được đặt giới hạn thời gian. Vui lòng đặt giới hạn thời gian cho website trước khi tạo cảnh báo.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {validWebsites.map((web) => {
                    const isSelected = selectedWebsites.includes(web.id);
                    const hasConfig = configs?.some((c) => c.allowedWebsiteId === web.id);
                    return (
                      <div
                        key={web.id}
                        onClick={() => toggleWebsite(web.id)}
                        className={`cursor-pointer rounded-2xl border-2 p-3 transition-all ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50'
                            : 'border-gray-100 bg-white hover:border-violet-200'
                        }`}
                      >
                        <div className="font-bold text-sm text-gray-900 truncate">{web.domain}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium text-gray-500">
                            {web.timeLimitMinutes} phút
                          </span>
                          {hasConfig && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 py-0">● Đã có</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div className={`transition-opacity ${selectedWebsites.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">2</span>
                Mốc cảnh báo 1 (Bắt buộc)
              </h3>
              
              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-4">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-gray-700 text-sm">Khi thời gian dùng đạt:</span>
                  <span className="text-orange-600 text-lg">{threshold1Percent}%</span>
                </div>
                
                <input
                  type="range"
                  min="10"
                  max="98"
                  step="5"
                  value={threshold1Percent}
                  onChange={(e) => setThreshold1Percent(parseInt(e.target.value))}
                  className="w-full accent-orange-500"
                />

                {/* Preview */}
                <div className="space-y-1 mt-2 mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Ước tính đối với các web đã chọn:</div>
                  {selectedWebsites.slice(0, 3).map(id => {
                    const w = validWebsites.find(x => x.id === id);
                    if (!w || !w.timeLimitMinutes) return null;
                    const used = Math.round(w.timeLimitMinutes * threshold1Percent / 100);
                    const remain = w.timeLimitMinutes - used;
                    return (
                      <div key={id} className="flex justify-between items-center text-xs bg-white px-2 py-1.5 rounded-lg border border-gray-100">
                        <span className="font-bold text-gray-700 truncate max-w-[120px]">{w.domain}</span>
                        <span className="text-gray-500">Đã dùng {used}p → <strong className="text-orange-600">Còn {remain}p</strong></span>
                      </div>
                    );
                  })}
                  {selectedWebsites.length > 3 && <div className="text-xs text-center text-gray-400 mt-1">...và {selectedWebsites.length - 3} web khác</div>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase">Nội dung thông báo</label>
                  <textarea
                    value={threshold1Message}
                    onChange={(e) => setThreshold1Message(e.target.value)}
                    maxLength={300}
                    rows={2}
                    className="w-full bg-white rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                    placeholder="VD: Con sắp hết giờ rồi, hãy chuẩn bị lưu bài tập nhé!"
                  />
                  <div className="text-right text-[10px] font-medium text-gray-400">{threshold1Message.length}/300</div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`transition-opacity ${selectedWebsites.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs ${useThreshold2 ? 'bg-red-500' : 'bg-gray-300'}`}>3</span>
                  Mốc cảnh báo 2 (Tuỳ chọn)
                </h3>
                <button 
                  onClick={() => setUseThreshold2(!useThreshold2)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${useThreshold2 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {useThreshold2 ? 'Bỏ mốc này' : 'Dùng mốc này'}
                </button>
              </div>

              {useThreshold2 && (
                <div className="bg-red-50 p-5 rounded-3xl border border-red-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-gray-700 text-sm">Khi thời gian dùng đạt:</span>
                    <span className="text-red-600 text-lg">{threshold2Percent}%</span>
                  </div>
                  
                  <input
                    type="range"
                    min={threshold1Percent + 5}
                    max="99"
                    step="1"
                    value={threshold2Percent}
                    onChange={(e) => setThreshold2Percent(parseInt(e.target.value))}
                    className="w-full accent-red-500"
                  />
                  {threshold2Percent <= threshold1Percent && (
                    <p className="text-xs text-red-500 font-medium">Mốc 2 phải lớn hơn mốc 1</p>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase">Nội dung thông báo mốc 2</label>
                    <textarea
                      value={threshold2Message}
                      onChange={(e) => setThreshold2Message(e.target.value)}
                      maxLength={300}
                      rows={2}
                      className="w-full bg-white rounded-xl border border-red-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                      placeholder="VD: Chỉ còn vài phút nữa là hệ thống chặn, con nhanh chóng tắt đi nhé!"
                    />
                    <div className="text-right text-[10px] font-medium text-gray-400">{threshold2Message.length}/300</div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <Button
              className="w-full h-12 rounded-2xl bg-violet-600 font-bold uppercase tracking-widest hover:bg-violet-700 disabled:opacity-50"
              onClick={handleSave}
              disabled={selectedWebsites.length === 0 || !threshold1Message.trim() || upsertMutation.isPending}
            >
              {upsertMutation.isPending ? 'Đang lưu...' : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Lưu cấu hình
                </>
              )}
            </Button>
          </div>

          {/* Right: Existing configs */}
          <div className="bg-gray-50 rounded-[2rem] border border-gray-100 p-6 flex flex-col h-[500px]">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Cấu hình đang áp dụng
            </h3>

            {isLoading ? (
              <div className="flex-1 flex justify-center items-center">
                <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !configs || configs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <Clock className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-sm font-medium text-gray-500">Chưa có cấu hình cảnh báo nào được tạo.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {configs.map((c) => (
                  <div key={c.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative group">
                    <div className="font-bold text-gray-900 text-base mb-2 pr-8">{c.domain}</div>
                    
                    <div className="space-y-3">
                      <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-50">
                        <div className="text-xs font-bold text-orange-600 mb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          Mốc {c.threshold1Percent}%
                        </div>
                        <div className="text-[13px] text-gray-700 font-medium italic">"{c.threshold1Message}"</div>
                      </div>

                      {c.threshold2Percent && (
                        <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-50">
                          <div className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Mốc {c.threshold2Percent}%
                          </div>
                          <div className="text-[13px] text-gray-700 font-medium italic">"{c.threshold2Message}"</div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xoá cảnh báo cho ${c.domain}?`)) {
                          deleteMutation.mutate(c.id);
                        }
                      }}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
