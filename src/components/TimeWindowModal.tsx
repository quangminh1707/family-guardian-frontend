import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Clock, Trash2, AlertTriangle, ShieldCheck, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { websitesApi } from '../api/websites.api';
import {
  timeWindowWarningConfigApi,
  type TimeWindowWarningConfig,
} from '../api/timeWindowWarningConfig.api';
import { ConfirmModal, toast } from './feedback';

interface Props {
  childId: number;
  childName: string;
  websites: {
    id: number;
    domain: string;
    timeLimitMinutes?: number | null;
    allowedStartTime?: string | null;
    allowedEndTime?: string | null;
  }[];
  onClose: () => void;
}

export default function TimeWindowModal({ childId, childName, websites, onClose }: Props) {
  const queryClient = useQueryClient();
  const eligibleWebsites = websites.filter((w) => w.timeLimitMinutes == null);

  // ── Bước 1: Chọn website ──────────────────────────────────────────────────
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number | null>(null);

  // ── Bước 2: Khung giờ ────────────────────────────────────────────────────
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');

  // ── Bước 3: Cảnh báo ─────────────────────────────────────────────────────
  const [useWarning, setUseWarning] = useState(false);
  const [warnMinutes1, setWarnMinutes1] = useState(10);
  const [message1, setMessage1] = useState('');
  const [useWarning2, setUseWarning2] = useState(false);
  const [warnMinutes2, setWarnMinutes2] = useState(5);
  const [message2, setMessage2] = useState('');

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TimeWindowWarningConfig | null>(null);

  // ── Query: lấy tw warning configs của con ────────────────────────────────
  const { data: twConfigs } = useQuery({
    queryKey: ['tw-warning-configs', childId],
    queryFn: () => timeWindowWarningConfigApi.getByChild(childId).then((r) => r.data),
  });

  // Load form khi chọn website
  useEffect(() => {
    if (!selectedWebsiteId) return;
    const web = websites.find((w) => w.id === selectedWebsiteId);
    if (web?.allowedStartTime) setStartTime(web.allowedStartTime.substring(0, 5));
    if (web?.allowedEndTime) setEndTime(web.allowedEndTime.substring(0, 5));

    // Load tw warning config nếu có
    const existingTw = twConfigs?.find((c) => c.allowedWebsiteId === selectedWebsiteId);
    if (existingTw) {
      setUseWarning(true);
      setWarnMinutes1(existingTw.warnMinutesBefore1 ?? 10);
      setMessage1(existingTw.message1 ?? '');
      if (existingTw.warnMinutesBefore2 != null) {
        setUseWarning2(true);
        setWarnMinutes2(existingTw.warnMinutesBefore2);
        setMessage2(existingTw.message2 || '');
      } else {
        setUseWarning2(false);
        setMessage2('');
      }
    } else {
      setUseWarning(false);
      setMessage1('');
      setUseWarning2(false);
      setMessage2('');
    }
  }, [selectedWebsiteId, twConfigs]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateWebsiteMutation = useMutation({
    mutationFn: (payload: { websiteId: number; startTime: string; endTime: string }) =>
      websitesApi.updateWebsite(childId, payload.websiteId, {
        timeLimitMinutes: null,
        allowedStartTime: payload.startTime + ':00',
        allowedEndTime: payload.endTime + ':00',
        isActive: true,
      }),
  });

  const upsertTwMutation = useMutation({
    mutationFn: timeWindowWarningConfigApi.upsert,
  });

  const deleteTwMutation = useMutation({
    mutationFn: timeWindowWarningConfigApi.delete,
    onSuccess: () => {
      toast.success('Đã xóa cấu hình cảnh báo khung giờ');
      queryClient.invalidateQueries({ queryKey: ['tw-warning-configs', childId] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Không thể xóa cấu hình'),
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const durationMinutes = (() => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  })();

  const handleSave = () => {
    if (!selectedWebsiteId) return toast.error('Vui lòng chọn website');
    if (!startTime || !endTime) return toast.error('Vui lòng nhập giờ bắt đầu và kết thúc');
    if (durationMinutes <= 0) return toast.error('Giờ kết thúc phải sau giờ bắt đầu');

    if (useWarning) {
      if (warnMinutes1 <= 0) return toast.error('Cảnh báo mốc 1 phải lớn hơn 0 phút');
      if (!message1.trim()) return toast.error('Vui lòng nhập nội dung cảnh báo mốc 1');
      if (useWarning2) {
        if (warnMinutes2 <= 0) return toast.error('Mốc 2 phải lớn hơn 0 phút');
        if (warnMinutes2 >= warnMinutes1) return toast.error('Mốc 2 phải gần hết giờ hơn mốc 1 (nhỏ hơn mốc 1)');
        if (!message2.trim()) return toast.error('Vui lòng nhập nội dung cảnh báo mốc 2');
      }
    }

    setShowSaveConfirm(true);
  };

  const executeSave = async () => {
    if (!selectedWebsiteId) return;
    setShowSaveConfirm(false);

    try {
      await updateWebsiteMutation.mutateAsync({
        websiteId: selectedWebsiteId,
        startTime,
        endTime,
      });

      if (useWarning && message1.trim()) {
        await upsertTwMutation.mutateAsync({
          allowedWebsiteId: selectedWebsiteId,
          warnMinutesBefore1: warnMinutes1,
          message1: message1.trim(),
          warnMinutesBefore2: useWarning2 ? warnMinutes2 : null,
          message2: useWarning2 ? message2.trim() : null,
        });
      }

      toast.success('Đã lưu khung giờ cho phép!');
      queryClient.invalidateQueries({ queryKey: ['websites', childId] });
      queryClient.invalidateQueries({ queryKey: ['tw-warning-configs', childId] });
      onClose();
    } catch {
      toast.error('Có lỗi khi lưu khung giờ');
    }
  };

  const isSaving = updateWebsiteMutation.isPending || upsertTwMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/40 backdrop-blur-sm modal-overlay">
      <div className="modal-container bg-bg-surface rounded-[2rem] w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="modal-header flex items-center justify-between p-6 border-b border-border-base shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-subtle flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="title text-xl font-black text-tx-primary uppercase">Thiết lập Khung giờ</h2>
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
            {/* Step 1: Chọn website */}
            <div>
              <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs">1</span>
                Chọn website
              </h3>
              {eligibleWebsites.length === 0 ? (
                <div className="bg-warning-bg text-warning p-4 rounded-2xl text-sm font-medium border border-warning/10 flex gap-2 items-start">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  Tất cả website đang dùng giới hạn phút. Hãy chỉnh sửa website để chuyển sang khung giờ trước.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                {eligibleWebsites.map((web) => {
                  const isSelected = selectedWebsiteId === web.id;
                  const hasTimeWindow = !!web.allowedStartTime;
                  const hasMinuteLimit = !!web.timeLimitMinutes;
                  return (
                    <div
                      key={web.id}
                      onClick={() => setSelectedWebsiteId(web.id)}
                      className={`cursor-pointer rounded-2xl border-2 p-3 transition-all ${
                        isSelected
                          ? 'border-brand bg-brand-subtle'
                          : 'border-border-base bg-bg-surface hover:border-brand/40'
                      }`}
                    >
                      <div className="title font-bold text-sm text-tx-primary truncate">{web.domain}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {hasTimeWindow && (
                          <Badge className="bg-brand-subtle text-brand hover:bg-brand-subtle text-[9px] px-1.5 py-0">
                            ⏰ Đang có khung giờ
                          </Badge>
                        )}
                        {hasMinuteLimit && (
                          <span title="Lưu sẽ xóa giới hạn phút">
                            <Badge className="bg-warning-bg text-warning hover:bg-warning-bg text-[9px] px-1.5 py-0 cursor-help">
                              ⚠ Giới hạn phút
                            </Badge>
                          </span>
                        )}
                        {!hasTimeWindow && !hasMinuteLimit && (
                          <span className="text-[10px] text-tx-muted">Chưa giới hạn</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>

            {/* Step 2: Thiết lập khung giờ */}
            <div className={`transition-opacity ${!selectedWebsiteId ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs">2</span>
                Khung giờ cho phép
              </h3>
              <div className="bg-bg-subtle p-5 rounded-3xl border border-border-subtle space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-tx-secondary uppercase">Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-custom w-full bg-bg-surface rounded-xl border border-border-base p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-tx-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-tx-secondary uppercase">Giờ kết thúc</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input-custom w-full bg-bg-surface rounded-xl border border-border-base p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-tx-primary"
                    />
                  </div>
                </div>

                {durationMinutes > 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-brand-subtle border border-brand/10 px-4 py-3 text-sm font-medium text-brand">
                    <Clock className="w-4 h-4 shrink-0" />
                    Con được dùng từ {startTime} đến {endTime} ({Math.floor(durationMinutes / 60)} giờ
                    {durationMinutes % 60 > 0 ? ` ${durationMinutes % 60} phút` : ''}/ngày)
                  </div>
                ) : startTime && endTime ? (
                  <div className="flex items-center gap-2 rounded-xl bg-error/5 border border-error/10 px-4 py-3 text-sm font-medium text-error">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Giờ kết thúc phải sau giờ bắt đầu
                  </div>
                ) : null}
              </div>
            </div>

            {/* Step 3: Cảnh báo (tùy chọn) */}
            <div className={`transition-opacity ${!selectedWebsiteId ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs ${useWarning ? 'bg-warning' : 'bg-bg-muted'}`}>3</span>
                  Cảnh báo trước khi hết giờ
                  <span className="text-[10px] font-normal text-tx-muted normal-case">(tùy chọn)</span>
                </h3>
                <button
                  onClick={() => setUseWarning(!useWarning)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${useWarning ? 'bg-warning/10 text-warning hover:bg-warning/20' : 'bg-bg-subtle text-tx-secondary hover:bg-bg-muted'}`}
                >
                  {useWarning ? 'Tắt cảnh báo' : 'Bật cảnh báo'}
                </button>
              </div>

              {useWarning && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Mốc 1 */}
                  <div className="bg-warning-bg/50 p-5 rounded-3xl border border-warning/10 space-y-3">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-tx-secondary text-sm flex items-center gap-2">
                        <Bell className="w-4 h-4 text-warning" /> Cảnh báo mốc 1
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-tx-muted whitespace-nowrap">Trước</span>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={warnMinutes1}
                        onChange={(e) => setWarnMinutes1(parseInt(e.target.value) || 1)}
                        className="input-custom w-20 bg-bg-surface rounded-xl border border-warning/20 p-2 text-sm text-center font-bold text-tx-primary focus:outline-none focus:ring-2 focus:ring-warning/20"
                      />
                      <span className="text-xs font-bold text-tx-muted">phút khi hết khung giờ</span>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-tx-secondary uppercase">Nội dung thông báo</label>
                      <textarea
                        value={message1}
                        onChange={(e) => setMessage1(e.target.value)}
                        maxLength={300}
                        rows={2}
                        className="input-custom w-full bg-bg-surface rounded-xl border border-warning/20 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all resize-none text-tx-primary"
                        placeholder="VD: Sắp hết khung giờ rồi con ơi!"
                      />
                      <div className="text-right text-[10px] font-medium text-tx-muted">{message1.length}/300</div>
                    </div>
                  </div>

                  {/* Mốc 2 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-tx-secondary uppercase">Mốc cảnh báo 2 (tùy chọn)</span>
                    <button
                      onClick={() => setUseWarning2(!useWarning2)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${useWarning2 ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-bg-subtle text-tx-secondary hover:bg-bg-muted'}`}
                    >
                      {useWarning2 ? 'Bỏ mốc này' : '+ Thêm mốc 2'}
                    </button>
                  </div>

                  {useWarning2 && (
                    <div className="bg-error/5 p-5 rounded-3xl border border-error/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-tx-muted whitespace-nowrap">Trước</span>
                        <input
                          type="number"
                          min={1}
                          max={warnMinutes1 - 1}
                          value={warnMinutes2}
                          onChange={(e) => setWarnMinutes2(parseInt(e.target.value) || 1)}
                          className="input-custom w-20 bg-bg-surface rounded-xl border border-error/20 p-2 text-sm text-center font-bold text-tx-primary focus:outline-none focus:ring-2 focus:ring-error/20"
                        />
                        <span className="text-xs font-bold text-tx-muted">phút khi hết khung giờ</span>
                      </div>
                      {warnMinutes2 >= warnMinutes1 && (
                        <p className="text-xs text-error font-medium">Mốc 2 phải nhỏ hơn mốc 1</p>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-tx-secondary uppercase">Nội dung mốc 2</label>
                        <textarea
                          value={message2}
                          onChange={(e) => setMessage2(e.target.value)}
                          maxLength={300}
                          rows={2}
                          className="input-custom w-full bg-bg-surface rounded-xl border border-error/20 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all resize-none text-tx-primary"
                          placeholder="VD: Còn 5 phút nữa là hết giờ!"
                        />
                        <div className="text-right text-[10px] font-medium text-tx-muted">{message2.length}/300</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nút Lưu */}
            <Button
              className="w-full h-12 rounded-2xl bg-brand font-bold uppercase tracking-widest hover:bg-brand-hover disabled:opacity-50"
              onClick={handleSave}
              disabled={!selectedWebsiteId || durationMinutes <= 0 || isSaving}
            >
              {isSaving ? 'Đang lưu...' : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Lưu khung giờ
                </>
              )}
            </Button>
          </div>

          {/* Right: Existing configs */}
          <div className="bg-bg-subtle/30 rounded-[2rem] border border-border-base p-6 flex flex-col h-[500px]">
            <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              Khung giờ đang áp dụng
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {eligibleWebsites.filter((w) => w.allowedStartTime).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
                  <Clock className="w-12 h-12 text-tx-muted/30 mb-4" />
                  <p className="text-sm font-medium text-tx-muted">Chưa có website nào được đặt khung giờ.</p>
                </div>
              ) : (
                eligibleWebsites
                  .filter((w) => w.allowedStartTime)
                  .map((w) => {
                    const twConfig = twConfigs?.find((c) => c.allowedWebsiteId === w.id);
                    return (
                      <div key={w.id} className="bg-bg-surface p-4 rounded-2xl border border-border-base shadow-sm relative group">
                        <div className="title font-bold text-tx-primary text-base mb-2">{w.domain}</div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-brand mb-2">
                          <Clock className="w-4 h-4" />
                          {w.allowedStartTime?.substring(0, 5)} → {w.allowedEndTime?.substring(0, 5)}
                        </div>
                        {twConfig && (
                          <div className="space-y-2 mt-3">
                            <div className="bg-warning-bg/50 p-2.5 rounded-xl border border-warning/10">
                              <div className="text-xs font-bold text-warning mb-1">Mốc 1: {twConfig.warnMinutesBefore1} phút trước</div>
                              <div className="text-[13px] text-tx-secondary font-medium italic">"{twConfig.message1}"</div>
                            </div>
                            {twConfig.warnMinutesBefore2 && (
                              <div className="bg-error/5 p-2.5 rounded-xl border border-error/10">
                                <div className="text-xs font-bold text-error mb-1">Mốc 2: {twConfig.warnMinutesBefore2} phút trước</div>
                                <div className="text-[13px] text-tx-secondary font-medium italic">"{twConfig.message2}"</div>
                              </div>
                            )}
                            <button
                              onClick={() => setDeleteTarget(twConfig)}
                              className="absolute top-4 right-4 text-tx-muted hover:text-error hover:bg-error/10 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showSaveConfirm}
        title="Xác nhận lưu khung giờ"
        message={`Lưu khung giờ ${startTime} → ${endTime} cho website đã chọn?`}
        confirmLabel="Có, lưu"
        cancelLabel="Không"
        variant="default"
        onConfirm={executeSave}
        onCancel={() => setShowSaveConfirm(false)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Xóa cấu hình cảnh báo"
        message={deleteTarget ? `Xóa cấu hình cảnh báo khung giờ cho website này?` : ''}
        confirmLabel="Xóa"
        variant="warning"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteTwMutation.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
