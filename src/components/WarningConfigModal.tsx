import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Trash2, ShieldCheck, Clock, Bell, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { warningConfigApi } from '../api/warningConfig.api';
import type { WarningConfig } from '../api/warningConfig.api';
import { ConfirmModal, toast } from './feedback';
import type { UpsertWarningConfigPayload } from '../api/warningConfig.api';

interface Props {
  childId: number;
  childName: string;
  websites: { id: number; domain: string; timeLimitMinutes?: number | null }[];
  onClose: () => void;
}

export default function WarningConfigModal({ childId, childName, websites, onClose }: Props) {
  const queryClient = useQueryClient();
  const validWebsites = websites.filter((w) => w.timeLimitMinutes && w.timeLimitMinutes > 0);
  const [deleteTarget, setDeleteTarget] = useState<WarningConfig | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingSavePayload, setPendingSavePayload] = useState<UpsertWarningConfigPayload | null>(null);

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
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể xóa cấu hình');
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

    setPendingSavePayload({
      allowedWebsiteIds: selectedWebsites,
      threshold1Percent,
      threshold1Message,
      threshold2Percent: useThreshold2 ? threshold2Percent : null,
      threshold2Message: useThreshold2 ? threshold2Message : null,
    });
    setShowSaveConfirm(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/40 backdrop-blur-sm modal-overlay">
      <div className="modal-container bg-bg-surface rounded-[2rem] w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="modal-header flex items-center justify-between p-6 border-b border-border-base shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-warning-bg flex items-center justify-center">
              <Bell className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="title text-xl font-black text-tx-primary uppercase">Cấu hình cảnh báo</h2>
              <p className="subtitle text-sm font-medium text-tx-secondary">Cho tài khoản: {childName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-bg-subtle flex items-center justify-center text-tx-muted hover:bg-error/10 hover:text-error transition-colors"
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
              <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs">1</span>
                Chọn website
              </h3>
              
              {validWebsites.length === 0 ? (
                <div className="bg-warning-bg text-warning p-4 rounded-2xl text-sm font-medium border border-warning/10 flex gap-2 items-start">
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
                            ? 'border-brand bg-brand-subtle'
                            : 'border-border-base bg-bg-surface hover:border-brand/40'
                        }`}
                      >
                        <div className="title font-bold text-sm text-tx-primary truncate">{web.domain}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium text-tx-secondary">
                            {web.timeLimitMinutes} phút
                          </span>
                          {hasConfig && (
                            <Badge className="bg-success-bg text-success hover:bg-success-bg text-[10px] px-1.5 py-0">● Đã có</Badge>
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
              <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-warning text-white flex items-center justify-center text-xs">2</span>
                Mốc cảnh báo 1 (Bắt buộc)
              </h3>
              
              <div className="bg-bg-subtle p-5 rounded-3xl border border-border-subtle space-y-4">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-tx-secondary text-sm">Khi thời gian dùng đạt:</span>
                  <span className="text-warning text-lg">{threshold1Percent}%</span>
                </div>
                
                <input
                  type="range"
                  min="10"
                  max="98"
                  step="5"
                  value={threshold1Percent}
                  onChange={(e) => setThreshold1Percent(parseInt(e.target.value))}
                  className="w-full accent-warning"
                />

                {/* Preview */}
                <div className="space-y-1 mt-2 mb-4">
                  <div className="text-xs font-medium text-tx-muted uppercase tracking-wider mb-2">Ước tính đối với các web đã chọn:</div>
                  {selectedWebsites.slice(0, 3).map(id => {
                    const w = validWebsites.find(x => x.id === id);
                    if (!w || !w.timeLimitMinutes) return null;
                    const used = Math.round(w.timeLimitMinutes * threshold1Percent / 100);
                    const remain = w.timeLimitMinutes - used;
                    return (
                      <div key={id} className="flex justify-between items-center text-xs bg-bg-surface px-2 py-1.5 rounded-lg border border-border-base">
                        <span className="font-bold text-tx-primary truncate max-w-[120px]">{w.domain}</span>
                        <span className="text-tx-secondary">Đã dùng {used}p → <strong className="text-warning">Còn {remain}p</strong></span>
                      </div>
                    );
                  })}
                  {selectedWebsites.length > 3 && <div className="text-xs text-center text-gray-400 mt-1">...và {selectedWebsites.length - 3} web khác</div>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-tx-secondary uppercase">Nội dung thông báo</label>
                  <textarea
                    value={threshold1Message}
                    onChange={(e) => setThreshold1Message(e.target.value)}
                    maxLength={300}
                    rows={2}
                    className="input-custom w-full bg-bg-surface rounded-xl border border-border-strong p-3 text-sm focus:outline-none focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all resize-none text-tx-primary"
                    placeholder="VD: Con sắp hết giờ rồi, hãy chuẩn bị lưu bài tập nhé!"
                  />
                  <div className="text-right text-[10px] font-medium text-tx-muted">{threshold1Message.length}/300</div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`transition-opacity ${selectedWebsites.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs ${useThreshold2 ? 'bg-error' : 'bg-bg-muted'}`}>3</span>
                  Mốc cảnh báo 2 (Tuỳ chọn)
                </h3>
                <button 
                  onClick={() => setUseThreshold2(!useThreshold2)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${useThreshold2 ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-bg-subtle text-tx-secondary hover:bg-bg-muted'}`}
                >
                  {useThreshold2 ? 'Bỏ mốc này' : 'Dùng mốc này'}
                </button>
              </div>

              {useThreshold2 && (
                <div className="bg-error/5 p-5 rounded-3xl border border-error/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-tx-secondary text-sm">Khi thời gian dùng đạt:</span>
                    <span className="text-error text-lg">{threshold2Percent}%</span>
                  </div>
                  
                  <input
                    type="range"
                    min={threshold1Percent + 5}
                    max="99"
                    step="1"
                    value={threshold2Percent}
                    onChange={(e) => setThreshold2Percent(parseInt(e.target.value))}
                    className="w-full accent-error"
                  />
                  {threshold2Percent <= threshold1Percent && (
                    <p className="text-xs text-error font-medium">Mốc 2 phải lớn hơn mốc 1</p>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-tx-secondary uppercase">Nội dung thông báo mốc 2</label>
                    <textarea
                      value={threshold2Message}
                      onChange={(e) => setThreshold2Message(e.target.value)}
                      maxLength={300}
                      rows={2}
                      className="input-custom w-full bg-bg-surface rounded-xl border border-error/20 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all resize-none text-tx-primary"
                      placeholder="VD: Chỉ còn vài phút nữa là hệ thống chặn, con nhanh chóng tắt đi nhé!"
                    />
                    <div className="text-right text-[10px] font-medium text-tx-muted">{threshold2Message.length}/300</div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <Button
              className="w-full h-12 rounded-2xl bg-brand font-bold uppercase tracking-widest hover:bg-brand-hover disabled:opacity-50"
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
          <div className="bg-bg-subtle/30 rounded-[2rem] border border-border-base p-6 flex flex-col h-[500px]">
            <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              Cấu hình đang áp dụng
            </h3>

            {isLoading ? (
              <div className="flex-1 flex justify-center items-center">
                <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !configs || configs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <Clock className="w-12 h-12 text-tx-muted/30 mb-4" />
                <p className="text-sm font-medium text-tx-muted">Chưa có cấu hình cảnh báo nào được tạo.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {configs.map((c) => (
                  <div key={c.id} className="bg-bg-surface p-4 rounded-2xl border border-border-base shadow-sm relative group">
                    <div className="title font-bold text-tx-primary text-base mb-2 pr-8">{c.domain}</div>
                    
                    <div className="space-y-3">
                      <div className="bg-warning-bg/50 p-2.5 rounded-xl border border-warning/10">
                        <div className="text-xs font-bold text-warning mb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                          Mốc {c.threshold1Percent}%
                        </div>
                        <div className="text-[13px] text-tx-secondary font-medium italic">"{c.threshold1Message}"</div>
                      </div>

                      {c.threshold2Percent && (
                        <div className="bg-error/5 p-2.5 rounded-xl border border-error/10">
                          <div className="text-xs font-bold text-error mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-error" />
                            Mốc {c.threshold2Percent}%
                          </div>
                          <div className="text-[13px] text-tx-secondary font-medium italic">"{c.threshold2Message}"</div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="absolute top-4 right-4 text-tx-muted hover:text-error hover:bg-error/10 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
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

      <ConfirmModal
        open={showSaveConfirm}
        title="Xác nhận lưu cấu hình"
        message="Bạn có muốn lưu cấu hình cảnh báo này không?"
        confirmLabel="Có, lưu"
        cancelLabel="Không"
        variant="default"
        onConfirm={() => {
          if (!pendingSavePayload) return;
          setShowSaveConfirm(false);
          upsertMutation.mutate(pendingSavePayload);
        }}
        onCancel={() => {
          setShowSaveConfirm(false);
          setPendingSavePayload(null);
        }}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Xóa cấu hình cảnh báo"
        message={
          deleteTarget
            ? `Xóa cấu hình cảnh báo cho ${deleteTarget.domain ?? 'website này'}?`
            : ''
        }
        confirmLabel="Xóa"
        variant="warning"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
