import { useState } from 'react';
import { ChevronRight, Download, Zap, LogIn, Shield } from 'lucide-react';
import { Card, Button } from '@/components/ui';

export default function ExtensionGuidePage() {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  const steps = [
    {
      number: 1,
      title: 'Tải Extension',
      icon: Download,
      description: 'Tải file extension Chrome về máy tính',
      details: [
        'Bấm nút "Tải về extension.crx" bên dưới',
        'Hoặc tìm trên Chrome Web Store',
        'Lưu ý: Chỉ hoạt động trên Google Chrome'
      ]
    },
    {
      number: 2,
      title: 'Cài vào Chrome',
      icon: Zap,
      description: 'Thêm extension vào trình duyệt',
      details: [
        'Mở chrome://extensions/ trong trình duyệt',
        'Bật nút "Developer mode" ở góc phải',
        'Kéo thả file .crx vào cửa sổ (hoặc bấm "Load unpacked")',
        'Chờ quá trình cài đặt hoàn tất'
      ],
      image: '🔧'
    },
    {
      number: 3,
      title: 'Đăng nhập',
      icon: LogIn,
      description: 'Đăng nhập bằng tài khoản Google con',
      details: [
        'Click icon extension trên thanh công cụ Chrome (góc phải)',
        'Chọn "Đăng nhập Google"',
        '⚠️ Đăng nhập bằng tài khoản Google của CON (không phải bố mẹ)',
        'Cấp quyền cho extension truy cập tài khoản'
      ]
    },
    {
      number: 4,
      title: 'Bật bộ lọc',
      icon: Shield,
      description: 'Kích hoạt bộ lọc web từ dashboard',
      details: [
        'Mở trang Dashboard → chọn tên con',
        'Tìm mục "🛡️ Bộ lọc web"',
        'Bấm toggle để BẬT bộ lọc',
        'Extension sẽ tự cập nhật cấu hình'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Hướng dẫn cài Chrome Extension</h1>
          <p className="text-gray-600 text-lg">
            Bộ lọc web Family Guardian dành cho con em của bạn
          </p>
        </div>

        {/* Info Box */}
        <Card className="mb-8 bg-blue-50 border-blue-200 p-6">
          <div className="flex gap-4">
            <div className="text-3xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Yêu cầu</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Máy tính chạy Windows, Mac hoặc Linux</li>
                <li>✓ Cài đặt Google Chrome (phiên bản mới nhất)</li>
                <li>✓ Tài khoản Google của con</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Steps */}
        <div className="space-y-4 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isExpanded = expandedStep === index;

            return (
              <Card
                key={index}
                className="overflow-hidden transition-all hover:shadow-lg cursor-pointer"
                onClick={() => setExpandedStep(isExpanded ? null : index)}
              >
                <div className="p-6 flex items-start gap-4 bg-white hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                      <span className="text-lg font-bold text-blue-600">{step.number}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>

                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-3">
                      {step.details.map((detail, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <span className="text-blue-500 font-bold text-lg">→</span>
                          <p className="text-gray-700 text-sm">{detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Download Section */}
        <Card className="mb-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Sẵn sàng để bắt đầu?</h2>
          <p className="mb-6 text-blue-100">Tải extension ngay bây giờ</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 py-2 rounded-lg flex items-center gap-2"
              onClick={() => {
                // TODO: Replace with actual download URL
                window.open('https://yourserver.com/extension/family-guardian.crx', '_blank');
              }}
            >
              <Download className="w-4 h-4" />
              Tải về extension.crx
            </Button>
            <Button
              className="bg-blue-500 text-white hover:bg-blue-700 font-semibold px-6 py-2 rounded-lg flex items-center gap-2"
              onClick={() => {
                window.open('https://chromewebstore.google.com/detail/family-guardian', '_blank');
              }}
            >
              Chrome Web Store
            </Button>
          </div>
        </Card>

        {/* Troubleshooting */}
        <Card className="bg-orange-50 border-orange-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">❓ Gặp vấn đề?</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <strong className="text-gray-900">Extension chưa hiện:</strong>
                <p className="ml-4 mt-1">Thử tắt và bật lại Chrome, hoặc reload trang web.</p>
              </div>
              <div>
                <strong className="text-gray-900">Đăng nhập không được:</strong>
                <p className="ml-4 mt-1">Kiểm tra kết nối internet, hoặc thử tài khoản Google khác.</p>
              </div>
              <div>
                <strong className="text-gray-900">Web vẫn bị chặn nhưng tôi đã thêm vào danh sách:</strong>
                <p className="ml-4 mt-1">Cache extension cập nhật mỗi 5 phút. Chờ hoặc tắt/bật extension.</p>
              </div>
              <div>
                <strong className="text-gray-900">Cần hỗ trợ khác:</strong>
                <p className="ml-4 mt-1">Liên hệ bố/mẹ hoặc quản trị viên hệ thống.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
