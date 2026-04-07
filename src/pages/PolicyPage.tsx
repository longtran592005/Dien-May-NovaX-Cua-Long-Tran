import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, RotateCcw, Truck, FileText, ChevronDown } from "lucide-react";

const policies = [
  {
    id: "warranty",
    icon: Shield,
    title: "Chính sách bảo hành",
    sections: [
      { title: "Điều kiện bảo hành", content: "Sản phẩm còn trong thời hạn bảo hành, có phiếu bảo hành hoặc hóa đơn mua hàng. Sản phẩm bị lỗi do nhà sản xuất, không do tác động ngoại lực hoặc sử dụng sai cách." },
      { title: "Thời gian bảo hành", content: "Điện thoại: 12 tháng. Laptop: 12-24 tháng. Tivi: 24 tháng. Tủ lạnh, máy giặt: 24 tháng. Phụ kiện: 6-12 tháng. Thời gian bảo hành tính từ ngày mua hàng trên hóa đơn." },
      { title: "Quy trình bảo hành", content: "1. Mang sản phẩm đến cửa hàng NovaX gần nhất kèm hóa đơn. 2. Kỹ thuật viên kiểm tra và xác nhận lỗi. 3. Sản phẩm được gửi về trung tâm bảo hành. 4. Thời gian xử lý: 7-15 ngày làm việc. 5. Nhận lại sản phẩm tại cửa hàng hoặc giao về nhà." },
      { title: "Trường hợp không bảo hành", content: "Sản phẩm hết hạn bảo hành. Tem bảo hành bị rách, hư hỏng. Sản phẩm bị tác động ngoại lực (va đập, rơi, nước). Đã sửa chữa tại nơi khác. Sử dụng sai cách, không đúng hướng dẫn." },
    ],
  },
  {
    id: "returns",
    icon: RotateCcw,
    title: "Chính sách đổi trả",
    sections: [
      { title: "Đổi trả trong 30 ngày", content: "NovaX áp dụng chính sách đổi trả linh hoạt trong 30 ngày kể từ ngày mua hàng. Sản phẩm lỗi do nhà sản xuất được đổi mới 1:1 trong 15 ngày đầu tiên." },
      { title: "Điều kiện đổi trả", content: "Sản phẩm còn nguyên hộp, phụ kiện đi kèm. Chưa kích hoạt bảo hành điện tử. Không có dấu hiệu đã qua sử dụng (trừ trường hợp lỗi). Có hóa đơn mua hàng hoặc thông tin đơn hàng trên hệ thống." },
      { title: "Hoàn tiền", content: "Hoàn tiền 100% trong 7 ngày đầu nếu sản phẩm lỗi. Hoàn tiền qua hình thức thanh toán ban đầu trong 3-5 ngày làm việc. Đối với thanh toán COD, hoàn qua chuyển khoản ngân hàng." },
    ],
  },
  {
    id: "shipping",
    icon: Truck,
    title: "Chính sách vận chuyển",
    sections: [
      { title: "Miễn phí giao hàng", content: "Miễn phí giao hàng toàn quốc cho tất cả đơn hàng từ 500.000đ. Đơn hàng dưới 500.000đ: phí ship 30.000đ (nội thành) và 50.000đ (ngoại thành)." },
      { title: "Thời gian giao hàng", content: "Nội thành TP.HCM và Hà Nội: 1-2 giờ (giao nhanh) hoặc trong ngày. Các tỉnh thành khác: 2-5 ngày làm việc. Khu vực hải đảo, vùng sâu vùng xa: 5-7 ngày." },
      { title: "Hình thức giao hàng", content: "Giao hàng tận nơi bởi đội ngũ NovaX Express. Hợp tác với Giao Hàng Nhanh, Giao Hàng Tiết Kiệm, Viettel Post. Lắp đặt miễn phí cho tivi, tủ lạnh, máy giặt, điều hòa." },
    ],
  },
  {
    id: "terms",
    icon: FileText,
    title: "Điều khoản sử dụng",
    sections: [
      { title: "Quyền và nghĩa vụ", content: "Người dùng cam kết cung cấp thông tin chính xác khi đặt hàng. NovaX cam kết bảo mật thông tin cá nhân theo quy định pháp luật. Giá và thông tin sản phẩm có thể thay đổi mà không báo trước." },
      { title: "Thanh toán", content: "Chấp nhận thanh toán: Tiền mặt (COD), chuyển khoản, thẻ tín dụng/ghi nợ, ví điện tử (MoMo, VNPay, ZaloPay). Hóa đơn VAT được xuất theo yêu cầu." },
      { title: "Quy định chung", content: "NovaX có quyền từ chối phục vụ các đơn hàng có dấu hiệu gian lận. Chương trình khuyến mãi không áp dụng đồng thời. Mọi tranh chấp được giải quyết theo pháp luật Việt Nam." },
    ],
  },
];

const PolicyPage = () => {
  const [activePolicy, setActivePolicy] = useState(policies[0].id);
  const [expandedSections, setExpandedSections] = useState<string[]>([policies[0].sections[0].title]);

  const currentPolicy = policies.find(p => p.id === activePolicy)!;

  const toggleSection = (title: string) => {
    setExpandedSections(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Chính sách</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">Chính sách NovaX</h1>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-4 sticky top-24 space-y-1">
            {policies.map(policy => (
              <button
                key={policy.id}
                onClick={() => { setActivePolicy(policy.id); setExpandedSections([policies.find(p => p.id === policy.id)!.sections[0].title]); }}
                className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activePolicy === policy.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              >
                <policy.icon className="w-4 h-4" />
                {policy.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
                <currentPolicy.icon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">{currentPolicy.title}</h2>
            </div>

            <div className="space-y-3">
              {currentPolicy.sections.map(section => (
                <div key={section.title} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="font-medium text-sm">{section.title}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSections.includes(section.title) ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedSections.includes(section.title) && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed animate-fade-in">
                      {section.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
