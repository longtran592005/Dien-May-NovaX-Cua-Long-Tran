import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Heart, MapPin, User, ChevronRight, Bell, Star, Trash2 } from "lucide-react";
import { formatPrice } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";

const mockOrders = [
  { id: "DH001", date: "2024-03-15", total: 29990000, status: "Đã giao", items: 1, productName: "iPhone 15 Pro Max" },
  { id: "DH002", date: "2024-03-10", total: 5490000, status: "Đang giao", items: 2, productName: "AirPods Pro 2" },
  { id: "DH003", date: "2024-02-28", total: 32990000, status: "Đã hủy", items: 1, productName: "MacBook Air M3" },
];

const ProfilePage = () => {
  const { user } = useAuth();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "addresses" | "notifications">("orders");

  const tabs = [
    { key: "orders" as const, label: "Đơn hàng", icon: Package, badge: mockOrders.length },
    { key: "wishlist" as const, label: "Yêu thích", icon: Heart, badge: wishlistItems.length },
    { key: "addresses" as const, label: "Địa chỉ", icon: MapPin },
    { key: "notifications" as const, label: "Thông báo", icon: Bell },
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
              <p className="font-semibold">{user?.name || 'Khách hàng'}</p>
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
                {tab.badge ? (
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                    {tab.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                )}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-4 border-t border-border">
            <Link to="/order-tracking" className="block text-sm text-primary font-medium hover:underline">
              📦 Tra cứu đơn hàng
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === "orders" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">Lịch sử đơn hàng</h2>
                <Link to="/order-tracking" className="text-sm text-primary hover:underline">Tra cứu đơn hàng →</Link>
              </div>
              {mockOrders.map(order => (
                <div key={order.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
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
              <h2 className="font-bold text-lg mb-3">Sản phẩm yêu thích ({wishlistItems.length})</h2>
              {wishlistItems.length === 0 ? (
                <div className="bg-secondary rounded-xl p-8 text-center">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-3">Bạn chưa có sản phẩm yêu thích nào.</p>
                  <Link to="/products" className="text-primary font-medium hover:underline">Khám phá sản phẩm →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {wishlistItems.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "addresses" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg">Địa chỉ giao hàng</h2>
                <button className="text-sm gradient-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:opacity-90">+ Thêm địa chỉ</button>
              </div>
              <div className="space-y-3">
                <div className="bg-card rounded-xl border-2 border-primary p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">Nhà riêng</p>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Mặc định</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Nguyễn Văn A</p>
                  <p className="text-sm text-muted-foreground">123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
                  <p className="text-sm text-muted-foreground">SĐT: 0901234567</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="font-medium text-sm">Công ty</p>
                  <p className="text-sm text-muted-foreground">Nguyễn Văn A</p>
                  <p className="text-sm text-muted-foreground">456 Lê Lợi, Quận 3, TP. Hồ Chí Minh</p>
                  <p className="text-sm text-muted-foreground">SĐT: 0987654321</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h2 className="font-bold text-lg mb-3">Thông báo</h2>
              <div className="space-y-2">
                {[
                  { title: "Đơn hàng DH002 đang giao", desc: "Đơn hàng của bạn đã được giao cho đơn vị vận chuyển.", time: "2 giờ trước", type: "order" },
                  { title: "Flash Sale sắp bắt đầu!", desc: "Giảm đến 50% cho tất cả điện thoại.", time: "5 giờ trước", type: "promo" },
                  { title: "Mã giảm giá NOVAX100K", desc: "Giảm 100.000đ cho đơn hàng từ 2 triệu.", time: "1 ngày trước", type: "promo" },
                ].map((n, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4 flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'promo' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                      {n.type === 'promo' ? '🏷️' : '📦'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
