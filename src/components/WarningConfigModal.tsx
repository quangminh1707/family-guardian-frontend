import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Trash2, ShieldCheck, Clock, Bell, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { warningConfigApi } from '../api/warningConfig.api';
import type { WarningConfig } from '../api/warningConfig.api';
import { websitesApi } from '../api/websites.api';
import {
  timeWindowWarningConfigApi,
  type TimeWindowWarningConfig,
  type UpsertTimeWindowWarningConfigPayload,
} from '../api/timeWindowWarningConfig.api';
import { ConfirmModal, toast } from './feedback';
import { formatTimeRange } from '../lib/formatters';
import type { UpsertWarningConfigPayload } from '../api/warningConfig.api';
import type { AllowedWebsite } from '../types/website.types';

interface Props {
  childId: number;
  childName: string;
  websites: AllowedWebsite[];
  onClose: () => void;
  defaultTab?: 'warning' | 'timewindow';
}

function RefactoredTimeWindowTab({ childId, websites }: Props) {
  const queryClient = useQueryClient();
  const eligibleWebsites = websites.filter((website) => website.timeLimitMinutes == null);

  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number | null>(null);
  const [warnMode, setWarnMode] = useState<'minutes_before' | 'at_time'>('minutes_before');

  const [warnMinutesBefore1, setWarnMinutesBefore1] = useState(10);
  const [warnMessage1, setWarnMessage1] = useState('');
  const [showWarning2, setShowWarning2] = useState(false);
  const [warnMinutesBefore2, setWarnMinutesBefore2] = useState(5);
  const [warnMessage2, setWarnMessage2] = useState('');

  const [warnAtTime1, setWarnAtTime1] = useState('');
  const [warnAtTimeMessage1, setWarnAtTimeMessage1] = useState('');
  const [warnAtTime2, setWarnAtTime2] = useState('');
  const [warnAtTimeMessage2, setWarnAtTimeMessage2] = useState('');

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TimeWindowWarningConfig | null>(null);

  const { data: twConfigs, isLoading } = useQuery({
    queryKey: ['tw-warning-configs', childId],
    queryFn: () => timeWindowWarningConfigApi.getByChild(childId).then((response) => response.data),
  });

  const selectedWebsite = selectedWebsiteId
    ? websites.find((website) => website.id === selectedWebsiteId) ?? null
    : null;
  const selectedWebsiteHasWindow = Boolean(selectedWebsite?.allowedStartTime && selectedWebsite?.allowedEndTime);

  useEffect(() => {
    if (!selectedWebsiteId) {
      setWarnMode('minutes_before');
      setWarnMinutesBefore1(10);
      setWarnMessage1('');
      setShowWarning2(false);
      setWarnMinutesBefore2(5);
      setWarnMessage2('');
      setWarnAtTime1('');
      setWarnAtTimeMessage1('');
      setWarnAtTime2('');
      setWarnAtTimeMessage2('');
      return;
    }

    const existingTw = twConfigs?.find((config) => config.allowedWebsiteId === selectedWebsiteId);

    if (existingTw?.warnMode === 'at_time') {
      setWarnMode('at_time');
      setWarnAtTime1(existingTw.warnAtTime1 ?? '');
      setWarnAtTimeMessage1(existingTw.message1 ?? '');
      setShowWarning2(existingTw.warnAtTime2 != null || existingTw.warnMinutesBefore2 != null);
      setWarnAtTime2(existingTw.warnAtTime2 ?? '');
      setWarnAtTimeMessage2(existingTw.message2 ?? '');

      setWarnMinutesBefore1(10);
      setWarnMessage1('');
      setWarnMinutesBefore2(5);
      setWarnMessage2('');
      return;
    }

    if (existingTw) {
      setWarnMode('minutes_before');
      setWarnMinutesBefore1(existingTw.warnMinutesBefore1 ?? 10);
      setWarnMessage1(existingTw.message1 ?? '');
      setShowWarning2(existingTw.warnMinutesBefore2 != null || existingTw.warnAtTime2 != null);
      setWarnMinutesBefore2(existingTw.warnMinutesBefore2 ?? 5);
      setWarnMessage2(existingTw.message2 ?? '');

      setWarnAtTime1('');
      setWarnAtTimeMessage1('');
      setWarnAtTime2('');
      setWarnAtTimeMessage2('');
      return;
    }

    setWarnMode('minutes_before');
    setWarnMinutesBefore1(10);
    setWarnMessage1('');
    setShowWarning2(false);
    setWarnMinutesBefore2(5);
    setWarnMessage2('');
    setWarnAtTime1('');
    setWarnAtTimeMessage1('');
    setWarnAtTime2('');
    setWarnAtTimeMessage2('');
  }, [selectedWebsiteId, twConfigs]);

  const upsertTwMutation = useMutation({
    mutationFn: timeWindowWarningConfigApi.upsert,
    onSuccess: () => {
      toast.success('Đã lưu cấu hình cảnh báo khung giờ!');
      queryClient.invalidateQueries({ queryKey: ['tw-warning-configs', childId] });
      // Keep modal open as requested
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể lưu cấu hình');
    },
  });

  const deleteTwMutation = useMutation({
    mutationFn: timeWindowWarningConfigApi.delete,
    onSuccess: () => {
      toast.success('Đã xoá cấu hình cảnh báo khung giờ');
      queryClient.invalidateQueries({ queryKey: ['tw-warning-configs', childId] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Không thể xoá cấu hình'),
  });

  const handleSave = () => {
    if (!selectedWebsiteId) return toast.error('Vui lòng chọn website');
    if (!selectedWebsite || !selectedWebsite.allowedStartTime || !selectedWebsite.allowedEndTime) {
      return toast.error('Website này chưa có khung giờ cho phép');
    }

    if (warnMode === 'minutes_before') {
      const windowDuration = timeToMinutes(selectedWebsite.allowedEndTime) - timeToMinutes(selectedWebsite.allowedStartTime);
      if (warnMinutesBefore1 <= 0) return toast.error('Mốc 1 phải lớn hơn 0 phút');
      if (warnMinutesBefore1 >= windowDuration) return toast.error('Mốc 1 phải nhỏ hơn độ dài khung giờ');
      if (!warnMessage1.trim()) return toast.error('Vui lòng nhập nội dung cảnh báo mốc 1');

      if (showWarning2) {
        if (warnMinutesBefore2 <= 0) return toast.error('Mốc 2 phải lớn hơn 0 phút');
        if (warnMinutesBefore2 >= warnMinutesBefore1) return toast.error('Mốc 2 phải nhỏ hơn mốc 1');
        if (warnMinutesBefore2 >= windowDuration) return toast.error('Mốc 2 phải nhỏ hơn độ dài khung giờ');
        if (!warnMessage2.trim()) return toast.error('Vui lòng nhập nội dung cảnh báo mốc 2');
      }
    } else {
      const allowedStart = selectedWebsite.allowedStartTime;
      const allowedEnd = selectedWebsite.allowedEndTime;

      if (!warnAtTime1.trim()) return toast.error('Vui lòng chọn giờ cảnh báo mốc 1');
      if (!warnAtTimeMessage1.trim()) return toast.error('Vui lòng nhập nội dung cảnh báo mốc 1');
      if (!isTimeWithinRange(warnAtTime1, allowedStart, allowedEnd)) {
        return toast.error('Giờ cảnh báo mốc 1 phải nằm trong khung giờ cho phép');
      }

      if (showWarning2) {
        if (!warnAtTime2.trim()) return toast.error('Vui lòng chọn giờ cảnh báo mốc 2');
        if (!warnAtTimeMessage2.trim()) return toast.error('Vui lòng nhập nội dung cảnh báo mốc 2');
        if (!isTimeWithinRange(warnAtTime2, allowedStart, allowedEnd)) {
          return toast.error('Giờ cảnh báo mốc 2 phải nằm trong khung giờ cho phép');
        }
        if (timeToMinutes(warnAtTime2) <= timeToMinutes(warnAtTime1)) {
          return toast.error('Mốc 2 phải sau mốc 1');
        }
      }
    }

    setShowSaveConfirm(true);
  };

  const executeSave = async () => {
    if (!selectedWebsiteId) return;
    setShowSaveConfirm(false);

    const payload: UpsertTimeWindowWarningConfigPayload =
      warnMode === 'minutes_before'
        ? {
            allowedWebsiteId: selectedWebsiteId,
            warnMode,
            warnMinutesBefore1,
            message1: warnMessage1.trim(),
            warnMinutesBefore2: showWarning2 ? warnMinutesBefore2 : undefined,
            message2: showWarning2 ? warnMessage2.trim() : undefined,
            warnAtTime1: null,
            warnAtTimeMessage1: null,
            warnAtTime2: null,
            warnAtTimeMessage2: null,
            isActive: true,
          }
        : {
            allowedWebsiteId: selectedWebsiteId,
            warnMode,
            warnMinutesBefore1: null,
            message1: null,
            warnMinutesBefore2: null,
            message2: null,
            warnAtTime1: warnAtTime1.trim() || undefined,
            warnAtTimeMessage1: warnAtTimeMessage1.trim(),
            warnAtTime2: showWarning2 ? warnAtTime2.trim() || undefined : undefined,
            warnAtTimeMessage2: showWarning2 ? warnAtTimeMessage2.trim() : undefined,
            isActive: true,
          };

    await upsertTwMutation.mutateAsync(payload);
  };

  const selectedWebsiteWindowText = selectedWebsite?.allowedStartTime && selectedWebsite?.allowedEndTime
    ? formatTimeRange(selectedWebsite.allowedStartTime, selectedWebsite.allowedEndTime)
    : 'Không có khung giờ';

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs">1</span>
              Chọn website
            </h3>

            {eligibleWebsites.length === 0 ? (
              <div className="bg-warning-bg text-warning p-4 rounded-2xl text-sm font-medium border border-warning/10 flex gap-2 items-start">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                Tất cả website đang dùng giới hạn phút. Hãy chuyển website sang khung giờ trước khi tạo cảnh báo.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {eligibleWebsites.map((web) => {
                  const isSelected = selectedWebsiteId === web.id;
                  const hasConfig = twConfigs?.some((config) => config.allowedWebsiteId === web.id);

                  return (
                    <button
                      key={web.id}
                      type="button"
                      onClick={() => setSelectedWebsiteId(web.id)}
                      className={`cursor-pointer rounded-2xl border-2 p-3 text-left transition-all ${
                        isSelected
                          ? 'border-brand bg-brand-subtle'
                          : 'border-border-base bg-bg-surface hover:border-brand/40'
                      }`}
                    >
                      <div className="title font-bold text-sm text-tx-primary truncate">{web.domain}</div>
                      <div className="mt-2 space-y-1">
                        <span className="block text-xs text-tx-secondary">
                          {web.allowedStartTime && web.allowedEndTime
                            ? formatTimeRange(web.allowedStartTime, web.allowedEndTime)
                            : 'Không có khung giờ'}
                        </span>
                        {hasConfig && (
                          <Badge className="bg-success-bg text-success hover:bg-success-bg text-[10px] px-1.5 py-0">
                            ● Đã có cấu hình
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

            <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-warning text-white flex items-center justify-center text-xs">2</span>
              MỐC CẢNH BÁO 1 (BẮT BUỘC)
            </h3>

            <div className="bg-bg-subtle p-5 rounded-3xl border border-border-subtle space-y-5">
              <div className="flex gap-2 p-1.5 mb-2 rounded-2xl bg-bg-subtle border border-border-subtle">
                <button
                  type="button"
                  onClick={() => setWarnMode('minutes_before')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    warnMode === 'minutes_before'
                      ? 'bg-brand text-white shadow-lg shadow-brand/20'
                      : 'text-tx-secondary hover:text-tx-primary hover:bg-bg-surface'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Trước N phút
                </button>
                <button
                  type="button"
                  onClick={() => setWarnMode('at_time')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    warnMode === 'at_time'
                      ? 'bg-brand text-white shadow-lg shadow-brand/20'
                      : 'text-tx-secondary hover:text-tx-primary hover:bg-bg-surface'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  Vào giờ cụ thể
                </button>
              </div>
              {warnMode === 'minutes_before' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-tx-secondary text-sm">Khi thời gian dùng đạt:</span>
                    <span className="text-warning text-lg">{warnMinutesBefore1} phút</span>
                  </div>

                  <input
                    type="range"
                    min={1}
                    max={120}
                    step={1}
                    value={warnMinutesBefore1}
                    onChange={(e) => setWarnMinutesBefore1(parseInt(e.target.value, 10) || 1)}
                    className="w-full accent-warning"
                  />

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-tx-secondary uppercase">Nội dung thông báo</label>
                    <textarea
                      value={warnMessage1}
                      onChange={(e) => setWarnMessage1(e.target.value)}
                      maxLength={300}
                      rows={2}
                      className="input-custom w-full bg-bg-surface rounded-xl border border-border-strong p-3 text-sm focus:outline-none focus:ring-2 focus:ring-warning/20 focus:border-warning transition-all resize-none text-tx-primary"
                      placeholder="VD: Sắp hết khung giờ rồi, con ơi!"
                    />
                    <div className="text-right text-[10px] font-medium text-tx-muted">{warnMessage1.length}/300</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-tx-secondary uppercase">Cảnh báo lúc</label>
                    <input
                      type="time"
                      value={warnAtTime1}
                      onChange={(e) => setWarnAtTime1(e.target.value)}
                      className="input-custom w-full bg-bg-surface rounded-xl border border-border-base p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-tx-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-tx-secondary uppercase">Nội dung thông báo</label>
                    <textarea
                      value={warnAtTimeMessage1}
                      onChange={(e) => setWarnAtTimeMessage1(e.target.value)}
                      placeholder="VD: Sắp hết thời gian dùng mạng hôm nay!"
                      className="input-custom w-full bg-bg-surface rounded-xl border border-border-strong p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none h-20 text-tx-primary"
                    />
                     <div className="text-right text-[10px] font-medium text-tx-muted">{warnAtTimeMessage1.length}/300</div>
                  </div>

                  {selectedWebsiteHasWindow && (
                    <p className="rounded-xl bg-brand-subtle/50 px-3 py-2 text-xs font-medium text-brand border border-brand/10">
                      Giờ cảnh báo nên nằm trong khung giờ {selectedWebsiteWindowText}
                    </p>
                  )}
                </div>
              )}
            </div>

          <div className={`transition-opacity ${!selectedWebsiteId ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs ${showWarning2 ? 'bg-error' : 'bg-bg-muted'}`}>3</span>
                  MỐC CẢNH BÁO 2 (TUỲ CHỌN)
                </h3>
                <button 
                  onClick={() => setShowWarning2(!showWarning2)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${showWarning2 ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-bg-subtle text-tx-secondary hover:bg-bg-muted'}`}
                >
                  {showWarning2 ? 'Bỏ mốc này' : 'Dùng mốc này'}
                </button>
              </div>

              {showWarning2 && (
                <div className="bg-error/5 p-5 rounded-3xl border border-error/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-2 p-1.5 mb-2 rounded-2xl bg-bg-subtle border border-border-subtle">
                    <button
                      type="button"
                      onClick={() => setWarnMode('minutes_before')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        warnMode === 'minutes_before'
                          ? 'bg-brand text-white shadow-lg shadow-brand/20'
                          : 'text-tx-secondary hover:text-tx-primary hover:bg-bg-surface'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      Trước N phút
                    </button>
                    <button
                      type="button"
                      onClick={() => setWarnMode('at_time')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        warnMode === 'at_time'
                          ? 'bg-brand text-white shadow-lg shadow-brand/20'
                          : 'text-tx-secondary hover:text-tx-primary hover:bg-bg-surface'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                      Vào giờ cụ thể
                    </button>
                  </div>

                  {warnMode === 'minutes_before' ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-tx-secondary text-sm">Khi thời gian dùng đạt:</span>
                        <span className="text-error text-lg">{warnMinutesBefore2} phút</span>
                      </div>

                      <input
                        type="range"
                        min={1}
                        max={Math.max(1, warnMinutesBefore1 - 1)}
                        step={1}
                        value={warnMinutesBefore2}
                        onChange={(e) => setWarnMinutesBefore2(parseInt(e.target.value, 10) || 1)}
                        className="w-full accent-error"
                      />

                      {warnMinutesBefore2 >= warnMinutesBefore1 && (
                        <p className="text-xs text-error font-medium">Mốc 2 phải nhỏ hơn mốc 1</p>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-tx-secondary uppercase">Nội dung thông báo mốc 2</label>
                        <textarea
                          value={warnMessage2}
                          onChange={(e) => setWarnMessage2(e.target.value)}
                          maxLength={300}
                          rows={2}
                          className="input-custom w-full bg-bg-surface rounded-xl border border-error/20 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all resize-none text-tx-primary"
                          placeholder="VD: Còn 5 phút nữa là hết giờ!"
                        />
                        <div className="text-right text-[10px] font-medium text-tx-muted">{warnMessage2.length}/300</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-tx-secondary uppercase">Cảnh báo lúc</label>
                        <input
                          type="time"
                          value={warnAtTime2}
                          onChange={(e) => setWarnAtTime2(e.target.value)}
                          className="input-custom w-full bg-bg-surface rounded-xl border border-error/20 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all text-tx-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-tx-secondary uppercase">Nội dung thông báo mốc 2</label>
                        <textarea
                          value={warnAtTimeMessage2}
                          onChange={(e) => setWarnAtTimeMessage2(e.target.value)}
                          placeholder="VD: Mốc cảnh báo 2..."
                          className="input-custom w-full bg-bg-surface rounded-xl border border-error/20 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all resize-none h-20 text-tx-primary"
                        />
                        <div className="text-right text-[10px] font-medium text-tx-muted">{warnAtTimeMessage2.length}/300</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>

          <Button
            className="w-full h-12 rounded-2xl bg-brand text-white font-bold uppercase tracking-widest hover:bg-brand-hover dark:bg-brand dark:hover:bg-brand-hover disabled:opacity-50 disabled:bg-brand/40 disabled:text-white/80 flex items-center justify-center gap-2"
            onClick={handleSave}
            disabled={!selectedWebsiteId || upsertTwMutation.isPending}
          >
            {upsertTwMutation.isPending ? (
              'Đang lưu...'
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                LƯU CẤU HÌNH
              </>
            )}
          </Button>
        </div>

          <div className="bg-bg-subtle/30 rounded-[2rem] border border-border-base p-6 flex flex-col h-[500px]">
            <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              CẤU HÌNH ĐANG ÁP DỤNG
            </h3>

            {isLoading ? (
              <div className="flex-1 flex justify-center items-center">
                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !twConfigs || twConfigs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <Clock className="w-12 h-12 text-tx-muted/30 mb-4" />
                <p className="text-sm font-medium text-tx-muted">Chưa có cấu hình cảnh báo nào được tạo.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {twConfigs.map((config) => {
                  const website = websites.find((item) => item.id === config.allowedWebsiteId);
                  const isAtTime = config.warnMode === 'at_time';

                  return (
                    <div key={config.id} className="bg-bg-surface p-4 rounded-2xl border border-border-base shadow-sm relative group">
                      <div className="flex items-start justify-between gap-3 mb-2 pr-8">
                        <div className="min-w-0">
                          <div className="title font-bold text-tx-primary text-base truncate">
                            {config.domain ?? website?.domain ?? 'Website'}
                          </div>
                          <div className="text-xs text-tx-secondary mt-1">
                            {website?.allowedStartTime && website?.allowedEndTime
                              ? formatTimeRange(website.allowedStartTime, website.allowedEndTime)
                              : 'Không có khung giờ'}
                          </div>
                        </div>
                        <Badge
                          className={`text-[10px] px-2 py-0 ${
                            isAtTime
                              ? 'bg-brand-subtle text-brand hover:bg-brand-subtle'
                              : 'bg-warning-bg text-warning hover:bg-warning-bg'
                          }`}
                        >
                          {isAtTime ? 'Vào giờ cụ thể' : 'Trước N phút'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-warning-bg/50 p-2.5 rounded-xl border border-warning/10">
                          <div className="text-xs font-bold text-warning mb-1">
                            {isAtTime
                              ? `Mốc 1: ${formatTimeShort(config.warnAtTime1)}`
                              : `Mốc 1: ${config.warnMinutesBefore1 ?? 0} phút trước`}
                          </div>
                          <div className="text-[13px] text-tx-secondary font-medium italic">
                            "{config.message1 ?? ''}"
                          </div>
                        </div>

                        {isAtTime
                          ? config.warnAtTime2 && (
                              <div className="bg-brand-subtle p-2.5 rounded-xl border border-brand/10">
                                <div className="text-xs font-bold text-brand mb-1">Mốc 2: {formatTimeShort(config.warnAtTime2)}</div>
                                <div className="text-[13px] text-tx-secondary font-medium italic">
                                  "{config.message2 ?? ''}"
                                </div>
                              </div>
                            )
                          : config.warnMinutesBefore2 != null && (
                              <div className="bg-error/5 p-2.5 rounded-xl border border-error/10">
                                <div className="text-xs font-bold text-error mb-1">Mốc 2: {config.warnMinutesBefore2} phút trước</div>
                                <div className="text-[13px] text-tx-secondary font-medium italic">
                                  "{config.message2 ?? ''}"
                                </div>
                              </div>
                            )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(config)}
                        className="absolute top-4 right-4 text-tx-muted hover:text-error hover:bg-error/10 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <ConfirmModal
          open={showSaveConfirm}
          title="Xác nhận lưu cấu hình"
          message={
            selectedWebsite
              ? `Lưu cấu hình ${warnMode === 'at_time' ? 'vào giờ cụ thể' : 'trước N phút'} cho ${selectedWebsite.domain}?`
              : ''
          }
          confirmLabel="Có, lưu"
          cancelLabel="Không"
          variant="default"
          onConfirm={executeSave}
          onCancel={() => setShowSaveConfirm(false)}
        />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Xóa cấu hình cảnh báo"
        message={deleteTarget ? `Xóa cấu hình cảnh báo cho ${deleteTarget.domain ?? 'website này'}?` : ''}
        confirmLabel="Xóa"
        variant="warning"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteTwMutation.mutate(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function formatTimeShort(timeStr?: string | null): string {
  return timeStr ? timeStr.substring(0, 5) : '';
}

function formatDurationText(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);

  if (totalMinutes <= 0) return '0 phút';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} phút`;
  if (minutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${minutes} phút`;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function isTimeWithinRange(time: string, startTime: string, endTime: string): boolean {
  const target = timeToMinutes(time);
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (end <= start) return false;
  return target >= start && target <= end;
}

export default function WarningConfigModal({ childId, childName, websites, onClose, defaultTab = 'warning' }: Props) {
  const [activeTab, setActiveTab] = useState<'warning' | 'timewindow'>(defaultTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/40 backdrop-blur-sm modal-overlay">
      <div className="modal-container bg-bg-surface rounded-[2rem] w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="modal-header flex flex-col pt-6 px-6 border-b border-border-base shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-warning-bg flex items-center justify-center">
                <Bell className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h2 className="title text-xl font-black text-tx-primary uppercase">Cấu hình hệ thống</h2>
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
          
          {/* Tabs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('warning')}
              className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'warning'
                  ? 'border-warning text-warning'
                  : 'border-transparent text-tx-secondary hover:text-tx-primary'
              }`}
            >
              Cảnh báo (Giới hạn phút)
            </button>
            <button
              onClick={() => setActiveTab('timewindow')}
              className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'timewindow'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-tx-secondary hover:text-tx-primary'
              }`}
            >
              Khung giờ (Tùy chỉnh)
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'warning' ? (
          <WarningTab childId={childId} childName={childName} websites={websites} onClose={onClose} />
        ) : (
          <RefactoredTimeWindowTab childId={childId} childName={childName} websites={websites} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function WarningTab({ childId, websites }: Props) {
  const queryClient = useQueryClient();
  const validWebsites = websites.filter((w) => w.timeLimitMinutes != null);
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
    <>
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
                    if (!w || w.timeLimitMinutes == null) return null;
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
              className="w-full h-12 rounded-2xl bg-violet-600 text-white font-bold uppercase tracking-widest hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400 disabled:opacity-50 disabled:bg-violet-300 disabled:text-white/80 flex items-center justify-center gap-2"
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
    </>
  );
}

export function TimeWindowTab({ childId, websites }: Props) {
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
    setStartTime(web?.allowedStartTime ? formatTimeShort(web.allowedStartTime) : '08:00');
    setEndTime(web?.allowedEndTime ? formatTimeShort(web.allowedEndTime) : '20:00');

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
  }, [selectedWebsiteId, twConfigs, websites]);

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
    } catch {
      toast.error('Có lỗi khi lưu khung giờ');
    }
  };

  const isSaving = updateWebsiteMutation.isPending || upsertTwMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Step 1: Chọn website */}
            <div>
              <h3 className="title text-sm font-bold text-tx-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-xs">1</span>
                Chọn website
              </h3>
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
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
                        <span className="text-xs font-medium text-tx-secondary">
                          {hasTimeWindow && web.allowedEndTime
                            ? formatTimeRange(web.allowedStartTime, web.allowedEndTime)
                            : 'Không có khung giờ'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                    Con được dùng từ {startTime} đến {endTime} ({formatDurationText(startTime, endTime)}/ngày)
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
              className="w-full h-12 rounded-2xl bg-brand text-white font-bold uppercase tracking-widest hover:bg-brand-hover dark:bg-brand dark:hover:bg-brand-hover disabled:opacity-50 disabled:bg-brand/40 disabled:text-white/80 flex items-center justify-center gap-2"
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
                eligibleWebsites.filter((w) => w.allowedStartTime).map((w) => {
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
    </>
  );
}
