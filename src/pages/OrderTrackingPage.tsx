import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Phone } from "lucide-react";
import { formatPrice } from "@/data/mockData";

const mockOrderTracking = {
  orderNumber: "DH002",
  date: "2026-04-05",
  total: 5490000,
  paymentMethod: "COD",
  customerName: "Nguyễn Văn A",
  phone: "0901234567",
  address: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  items: [
    { name: "AirPods Pro 2 USB-C", quantity: 1, price: 5490000, image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=100&h=100&fit=crop" },
  ],
  timeline: [
    { status: "Đặt hàng thành công", date: "05/04/2026 10:30", done: true, icon: Package },
    { status: "Đã xác nhận", date: "05/04/2026 11:15", done: true, icon: CheckCircle },
    { status: "Đang chuẩn bị hàng", date: "05/04/2026 14:00", done: true, icon: Package },
    { status: "Đang vận chuyển", date: "06/04/2026 08:30", done: true, icon: Truck },
    { status: "Đã giao hàng", date: "", done: false, icon: CheckCircle },
  ],
  shipper: { name: "Giao Hàng Nhanh", tracking: "GHN123456789", phone: "1900 6888" },
};

const OrderTrackingPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [trackingData, setTrackingData] = useState<typeof mockOrderTracking | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (searchValue.trim().toUpperCase() === "DH002" || searchValue.trim() === "0901234567") {
      setTrackingData(mockOrderTracking);
    } else {
      setTrackingData(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Theo dõi đơn hàng</span>
      </nav>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Theo dõi đơn hàng</h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder="Nhập mã đơn hàng hoặc số điện thoại..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <button type="submit" className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
              Tra cứu
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Thử: DH002 hoặc 0901234567</p>
        </form>

        {searched && !trackingData && (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn hàng.</p>
          </div>
        )}

        {trackingData && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg">Đơn hàng #{trackingData.orderNumber}</h2>
                  <p className="text-sm text-muted-foreground">Ngày đặt: {trackingData.date}</p>
                </div>
                <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                  Đang giao
                </span>
              </div>

              {/* Items */}
              {trackingData.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-t border-border">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Số lượng: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sale">{formatPrice(item.price)}</p>
                </div>
              ))}

              <div className="border-t border-border pt-3 mt-3 flex justify-between">
                <span className="text-sm text-muted-foreground">Tổng cộng</span>
                <span className="font-bold text-sale">{formatPrice(trackingData.total)}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-bold mb-4">Trạng thái đơn hàng</h3>
              <div className="space-y-0">
                {trackingData.timeline.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.done ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                        <step.icon className="w-4 h-4" />
                      </div>
                      {i < trackingData.timeline.length - 1 && (
                        <div className={`w-0.5 h-12 ${step.done ? 'bg-primary' : 'bg-border'}`}></div>
                      )}
                    </div>
                    <div className="pb-8">
                      <p className={`font-medium text-sm ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.status}</p>
                      <p className="text-xs text-muted-foreground">{step.date || "Đang chờ..."}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & Address */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Địa chỉ nhận hàng
                </h3>
                <p className="text-sm font-medium">{trackingData.customerName}</p>
                <p className="text-sm text-muted-foreground mt-1">{trackingData.address}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="w-3.5 h-3.5" /> {trackingData.phone}
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Thông tin vận chuyển
                </h3>
                <p className="text-sm"><span className="text-muted-foreground">Đơn vị:</span> {trackingData.shipper.name}</p>
                <p className="text-sm mt-1"><span className="text-muted-foreground">Mã vận đơn:</span> {trackingData.shipper.tracking}</p>
                <p className="text-sm mt-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Hotline:</span> {trackingData.shipper.phone}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;
