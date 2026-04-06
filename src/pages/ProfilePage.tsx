import { useState } from "react";
import { Package, Heart, MapPin, User, ChevronRight } from "lucide-react";
import { formatPrice } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

const mockOrders = [
  { id: "DH001", date: "2024-03-15", total: 29990000, status: "Đã giao", items: 1, productName: "iPhone 15 Pro Max" },
  { id: "DH002", date: "2024-03-10", total: 5490000, status: "Đang giao", items: 2, productName: "AirPods Pro 2" },
  { id: "DH003", date: "2024-02-28", total: 32990000, status: "Đã hủy", items: 1, productName: "MacBook Air M3" },
];

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "addresses">("orders");

  const tabs = [
    { key: "orders" as const, label: "Đơn hàng", icon: Package },
    { key: "wishlist" as const, label: "Yêu thích", icon: Heart },
    { key: "addresses" as const, label: "Địa chỉ", icon: MapPin },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Tài khoản</h1>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold">{user?.name || 'Khach hang'}</p>
              <p className="text-xs text-muted-foreground">{user?.email || 'user@email.com'}</p>
            </div>
          </div>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <ChevronRight className="w-3.5 h-3.5 ml-auto" />
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === "orders" && (
            <div className="space-y-3">
              <h2 className="font-bold text-lg">Lịch sử đơn hàng</h2>
              {mockOrders.map(order => (
                <div key={order.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{order.productName}</p>
                    <p className="text-xs text-muted-foreground">Mã: {order.id} • {order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatPrice(order.total)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      order.status === "Đã giao" ? "bg-success/10 text-success" :
                      order.status === "Đang giao" ? "bg-primary/10 text-primary" :
                      "bg-sale/10 text-sale"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === "wishlist" && (
            <div>
              <h2 className="font-bold text-lg mb-3">Sản phẩm yêu thích</h2>
              <div className="bg-secondary rounded-xl p-8 text-center">
                <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Bạn chưa có sản phẩm yêu thích nào.</p>
              </div>
            </div>
          )}
          {activeTab === "addresses" && (
            <div>
              <h2 className="font-bold text-lg mb-3">Địa chỉ giao hàng</h2>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="font-medium text-sm">Nhà riêng</p>
                <p className="text-sm text-muted-foreground mt-1">123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
                <p className="text-sm text-muted-foreground">SĐT: 0901234567</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
