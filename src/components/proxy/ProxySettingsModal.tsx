import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proxyApi, type AddIpMappingRequest } from '../../api/proxy.api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, Trash2, Download, Plus, AlertCircle, Wifi } from 'lucide-react';
import { toast } from 'sonner';

interface ProxySettingsModalProps {
  childId: number;
}

export default function ProxySettingsModal({ childId }: ProxySettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const queryClient = useQueryClient();

  // Lấy danh sách IP mapping
  const { data: mappings, isLoading } = useQuery({
    queryKey: ['ipMappings', childId],
    queryFn: () => proxyApi.getIpMappings(childId).then(res => res.data),
    enabled: open,
  });

  // Thêm IP mapping
  const addMutation = useMutation({
    mutationFn: async (data: AddIpMappingRequest) => {
      return proxyApi.addIpMapping(childId, data);
    },
    onSuccess: () => {
      toast.success('✅ Thêm IP thành công!');
      setIpAddress('');
      setDeviceName('');
      queryClient.invalidateQueries({ queryKey: ['ipMappings', childId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi thêm IP');
    },
  });

  // Xóa IP mapping
  const removeMutation = useMutation({
    mutationFn: (mappingId: number) => proxyApi.removeIpMapping(childId, mappingId),
    onSuccess: () => {
      toast.success('✅ Xóa IP thành công!');
      queryClient.invalidateQueries({ queryKey: ['ipMappings', childId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa IP');
    },
  });

  // Download root cert
  const downloadCert = async () => {
    try {
      const response = await proxyApi.downloadRootCert();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'FamilyGuardian-RootCA.pfx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('✅ Tải certificate thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi tải certificate');
    }
  };

  const handleAddMapping = () => {
    if (!ipAddress.trim()) {
      toast.error('⚠️ Vui lòng nhập địa chỉ IP');
      return;
    }

    // Validate IP format (simple check)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ipAddress.trim())) {
      toast.error('⚠️ Định dạng IP không hợp lệ (VD: 192.168.1.100)');
      return;
    }

    addMutation.mutate({
      ipAddress: ipAddress.trim(),
      deviceName: deviceName.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl h-11 px-5 border-gray-100 bg-white hover:bg-violet-50 hover:border-violet-100 hover:text-violet-600 transition-all font-bold text-xs uppercase tracking-wider gap-2">
          <Wifi className="w-4 h-4" />
          Cài đặt Proxy
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl rounded-[2rem] bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-gray-900">
            ⚙️ Cài đặt Proxy & Thiết bị
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">💡 Cách hoạt động:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Thêm IP của thiết bị con để bật proxy kiểm soát</li>
                <li>Hệ thống tự động gắn Google Account của con vào IP này</li>
                <li>Con chỉ có thể truy cập website được phép qua tài khoản Google đó</li>
              </ul>
            </div>
          </div>

          {/* Add IP Form */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900">Thêm IP thiết bị mới</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                  📍 Địa chỉ IP *
                </label>
                <Input
                  placeholder="VD: 192.168.1.100"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="rounded-lg border-gray-200 focus:border-violet-400"
                  disabled={addMutation.isPending}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                  💻 Tên thiết bị (Tùy chọn)
                </label>
                <Input
                  placeholder="VD: Laptop con, iPad An"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="rounded-lg border-gray-200 focus:border-violet-400"
                  disabled={addMutation.isPending}
                />
              </div>
            </div>

            <Button
              onClick={handleAddMapping}
              disabled={addMutation.isPending}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg h-10"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm IP
                </>
              )}
            </Button>
          </div>

          {/* IP Mappings List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">📋 Danh sách IP hiện tại</h3>
              {mappings && mappings.length > 0 && (
                <span className="text-xs font-bold bg-violet-100 text-violet-700 px-3 py-1 rounded-full">
                  {mappings.length} thiết bị
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : mappings && mappings.length > 0 ? (
              <div className="space-y-2">
                {mappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 font-mono">{mapping.ipAddress}</p>
                      {mapping.deviceName && (
                        <p className="text-xs text-gray-500">{mapping.deviceName}</p>
                      )}
                      {mapping.googleEmail && (
                        <p className="text-xs text-violet-600 font-medium">
                          👤 {mapping.googleEmail}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMutation.mutate(mapping.id)}
                      disabled={removeMutation.isPending}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wifi className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có IP nào được cấu hình</p>
              </div>
            )}
          </div>

          {/* Certificate Download */}
          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-900 mb-3">🔐 Root Certificate (HTTPS)</h3>
            <p className="text-xs text-gray-600 mb-4">
              Tải certificate để cài đặt trên máy con, giúp proxy kiểm soát HTTPS:
            </p>
            <Button
              onClick={downloadCert}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg h-10"
            >
              <Download className="w-4 h-4 mr-2" />
              Tải Certificate (FamilyGuardian-RootCA.pfx)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
