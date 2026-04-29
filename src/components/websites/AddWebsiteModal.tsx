import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
} from "../ui/dialog";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Globe, Plus, CheckCircle, AlertTriangle, Loader2, Sparkles, Clock, Lock } from 'lucide-react';
import { websitesApi } from '../../api/websites.api';
import { websiteCheckApi } from '../../api/websiteCheck.api';
import type { WebsiteCheckResult } from '../../types/website.types';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { ConfirmModal, toast } from '../feedback';

interface AddWebsiteModalProps {
  childId: number;
}

export default function AddWebsiteModal({ childId }: AddWebsiteModalProps) {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [domain, setDomain] = useState('');
  const [checkResult, setCheckResult] = useState<WebsiteCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('21:00');

  const queryClient = useQueryClient();

  const handleCheck = async () => {
    if (!domain) return;
    setIsChecking(true);
    setCheckResult(null);
    try {
      const { data } = await websiteCheckApi.checkWebsite(domain);
      setCheckResult(data);
      if (data.isSafe) toast.success('Website an toàn để thêm!');
      else toast.warning('Cảnh báo: Website này có thể không an toàn.');
    } catch {
      toast.error('Không thể kiểm tra website. Thử lại sau.');
    } finally {
      setIsChecking(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: () => websitesApi.addWebsite(childId, {
      domain: checkResult?.domain || domain,
      timeLimitMinutes: timeLimitEnabled ? timeLimitMinutes : undefined,
      allowedStartTime: scheduleEnabled ? startTime : undefined,
      allowedEndTime: scheduleEnabled ? endTime : undefined,
    }),
    onSuccess: () => {
      toast.success('Đã thêm website thành công!');
      queryClient.invalidateQueries({ queryKey: ['websites', childId] });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const resetForm = () => {
    setDomain('');
    setCheckResult(null);
    setTimeLimitEnabled(false);
    setScheduleEnabled(false);
  };

  const handleOpenConfirm = () => {
    if (!checkResult && !domain.trim()) {
      toast.error('Vui lòng nhập website trước');
      return;
    }

    setShowConfirm(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-2xl h-auto py-3 px-6 shadow-xl shadow-violet-500/20 gap-2">
          <Plus className="w-5 h-5" />
          <span className="font-bold uppercase tracking-tight">Thêm website</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="modal-container modal-animate sm:max-w-lg rounded-[2.5rem] p-0 overflow-hidden border border-border-base shadow-2xl bg-bg-surface text-tx-primary">
        <DialogHeader className="modal-header border-b border-border-base bg-gradient-to-r from-bg-subtle/50 to-bg-surface p-8 pb-6 text-left">
          <DialogTitle className="title text-2xl font-black flex items-center gap-3">
            <div className="bg-brand/10 p-2 rounded-xl ring-1 ring-brand/20">
              <Sparkles className="h-6 w-6 text-brand" />
            </div>
            Cho phép website mới
          </DialogTitle>
          <DialogDescription className="subtitle text-tx-secondary mt-2 font-medium">
            Tất cả website khác sẽ bị chặn trên trình duyệt của con bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
             <Label className="description text-[10px] font-bold uppercase tracking-[0.2em] text-tx-muted">Địa chỉ website</Label>
             <div className="flex gap-3">
                <Input 
                  placeholder="ví dụ: youtube.com" 
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="input-custom rounded-2xl h-12 border-border-base bg-bg-surface transition-all font-medium placeholder:text-tx-muted text-tx-primary"
                />
                <Button 
                  onClick={handleCheck} 
                  disabled={isChecking || !domain}
                  className="h-12 px-6 rounded-2xl bg-success hover:bg-success/90 font-bold text-white shadow-lg shadow-success/20"
                >
                  {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kiểm tra'}
                </Button>
             </div>
          </div>

          {/* Check Result Card */}
          {checkResult && (
            <div className={cn(
              "p-6 rounded-3xl border animate-in zoom-in-95 duration-300",
              checkResult.isSafe ? "bg-success/10 border-success/30" : "bg-error/10 border-error/30"
            )}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-bg-surface rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-border-base">
                   {checkResult.faviconUrl ? (
                     <img src={checkResult.faviconUrl} className="w-8 h-8 rounded-lg" alt="" />
                   ) : (
                     <Globe className="w-8 h-8 text-tx-muted" />
                   )}
                </div>
                <div className="flex-1">
                  <h5 className="title font-bold text-tx-primary">{checkResult.domain}</h5>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border-none",
                      checkResult.isReachable ? "bg-success/15 text-success" : "bg-error/15 text-error"
                    )}>
                      {checkResult.isReachable ? `Hoạt động (${checkResult.httpStatusCode})` : 'Không phản hồi'}
                    </Badge>
                    <Badge variant="secondary" className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border-none",
                      checkResult.isSafe ? "bg-success/15 text-success" : "bg-error/15 text-error"
                    )}>
                      {checkResult.isSafe ? 'An toàn' : `Rủi ro: ${checkResult.threatType}`}
                    </Badge>
                  </div>
                </div>
                {checkResult.isSafe ? (
                  <CheckCircle className="w-6 h-6 text-success shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-error shrink-0" />
                )}
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div className="space-y-6 pt-4 border-t border-border-base">
            <div className="flex items-center justify-between group">
              <div className="space-y-1">
                <Label className="font-bold text-tx-primary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand" />
                  <span className="title">Giới hạn sử dụng mỗi ngày</span>
                </Label>
                <p className="description text-[10px] text-tx-muted font-bold uppercase tracking-widest">CON SẼ BỊ CHẶN KHI HẾT THỜI GIAN</p>
              </div>
              <Switch checked={timeLimitEnabled} onCheckedChange={setTimeLimitEnabled} className="data-[state=checked]:bg-success" />
            </div>

            {timeLimitEnabled && (
              <div className="bg-bg-subtle/30 rounded-[2rem] p-6 animate-in slide-in-from-top-4 duration-300 ring-1 ring-border-base">
                <div className="flex items-center justify-between gap-4">
                  <Input 
                    type="number" 
                    value={timeLimitMinutes} 
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="input-custom rounded-2xl h-12 bg-bg-surface w-24 text-center font-bold border-border-base text-tx-primary"
                  />
                  <span className="font-bold text-tx-muted uppercase tracking-widest text-xs">phút mỗi ngày</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-bold text-tx-primary flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand" />
                  <span className="title">Khung giờ cho phép</span>
                </Label>
                <p className="description text-[10px] text-tx-muted font-bold uppercase tracking-widest">GIỚI HẠN GIỜ DÙNG TRONG NGÀY</p>
              </div>
              <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} className="data-[state=checked]:bg-success" />
            </div>

            {scheduleEnabled && (
              <div className="bg-bg-subtle/30 rounded-[2rem] p-6 grid grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300 ring-1 ring-border-base">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Từ lúc</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded-2xl h-12 bg-bg-surface font-bold border-border-base text-tx-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Đến lúc</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-custom rounded-2xl h-12 bg-bg-surface font-bold border-border-base text-tx-primary" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-bg-subtle/50 p-6 flex gap-3 border-t border-border-base">
           <Button variant="ghost" onClick={() => setOpen(false)} className="flex-1 rounded-2xl h-12 font-bold uppercase text-tx-secondary hover:bg-bg-subtle">Hủy bỏ</Button>
           <Button 
            disabled={!checkResult || addMutation.isPending}
            onClick={handleOpenConfirm}
            className="flex-[2] rounded-2xl h-12 bg-brand hover:bg-brand/90 font-bold uppercase tracking-wider text-white shadow-lg shadow-brand/20 transition-all"
          >
            {addMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận & Thêm'}
          </Button>
        </div>
      </DialogContent>

      <ConfirmModal
        open={showConfirm}
        title="Xác nhận thêm website"
        message={`Bạn có muốn thêm website ${checkResult?.domain || domain} vào danh sách không?`}
        confirmLabel="Có, thêm"
        cancelLabel="Không"
        variant="default"
        onConfirm={() => {
          setShowConfirm(false);
          addMutation.mutate();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </Dialog>
  );
}
