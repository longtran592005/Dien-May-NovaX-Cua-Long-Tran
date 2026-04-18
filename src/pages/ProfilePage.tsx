import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Heart, MapPin, User, ChevronRight, Bell, Star, Trash2, ShieldCheck, Wallet, Plus, CheckCircle2, Map, Edit3 } from "lucide-react";
import { formatPrice } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import OpenStreetMapPicker, { AddressFromMap } from "@/components/OpenStreetMapPicker";
import { listAddresses, addAddress, deleteAddress, Address, me } from "@/services/authApi";
import { listOrders } from "@/services/orderApi";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "addresses" | "points" | "warranties">("orders");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressInputMethod, setAddressInputMethod] = useState<"manual" | "maps">("manual");
  const [newAddress, setNewAddress] = useState<Address>({
    fullName: "", phone: "", province: "TP. Hồ Chí Minh", district: "", ward: "", streetAddress: "", label: "Nhà riêng", isDefault: false
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        setPoints(user?.points || 0);

        const [profileResult, addressResult, orderResult] = await Promise.allSettled([
          me(),
          listAddresses(),
          listOrders()
        ]);

        if (profileResult.status === 'fulfilled') {
          setPoints(profileResult.value.points || user?.points || 0);
        }

        if (addressResult.status === 'fulfilled') {
          setAddresses(addressResult.value || []);
        } else {
          console.error('Failed to load addresses', addressResult.reason);
        }

        if (orderResult.status === 'fulfilled') {
          setOrders(Array.isArray(orderResult.value) ? orderResult.value : []);
        } else {
          console.error('Failed to load orders', orderResult.reason);
        }
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.points]);

  const handleAddAddress = async () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.streetAddress) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    try {
      const added = await addAddress(newAddress);
      setAddresses([...addresses, added]);
      setShowAddressForm(false);
      toast.success("Đã thêm địa chỉ!");
    } catch {
      toast.error("Không thể thêm địa chỉ");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      setAddresses(addresses.filter(a => a.id !== id));
      toast.success("Đã xóa địa chỉ");
    } catch {
      toast.error("Không thể xóa địa chỉ");
    }
  };

  const handleMapAddressSelect = (addressData: AddressFromMap) => {
    setNewAddress({
      ...newAddress,
      streetAddress: addressData.streetAddress,
      ward: addressData.ward,
      district: addressData.district,
      province: addressData.province || newAddress.province
    });
    toast.success("Địa chỉ từ Google Maps đã tải lên");
  };

  const tabs = [
    { key: "orders" as const, label: "Đơn hàng", icon: Package, badge: orders.length },
    { key: "points" as const, label: "NovaPoints", icon: Wallet },
    { key: "addresses" as const, label: "Địa chỉ", icon: MapPin },
    { key: "warranties" as const, label: "Bảo hành", icon: ShieldCheck },
    { key: "wishlist" as const, label: "Yêu thích", icon: Heart, badge: wishlistItems.length },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Sidebar */}
        <div className="md:w-80 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12"></div>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white mb-4 shadow-lg ring-4 ring-primary/10">
                <User className="w-10 h-10" />
              </div>
              <h1 className="text-xl font-black uppercase tracking-tight">{user?.name || 'Khách hàng'}</h1>
              <p className="text-xs text-muted-foreground font-bold opacity-60 mt-1">{user?.email}</p>
              
              <div className="mt-6 w-full pt-6 border-t border-border flex justify-around">
                 <div className="text-center">
                    <p className="text-lg font-black text-primary">{points}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Points</p>
                 </div>
                 <div className="w-px bg-border h-8"></div>
                 <div className="text-center">
                    <p className="text-lg font-black text-primary">{orders.length}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Orders</p>
                 </div>
              </div>
            </div>
          </div>

          <nav className="bg-card border border-border rounded-2xl p-2 shadow-sm">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.key ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === tab.key ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === "orders" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-black text-2xl uppercase tracking-tighter">Lịch sử đơn hàng</h2>
                <Link to="/order-tracking" className="text-xs font-black text-primary uppercase hover:underline">Tra cứu tất cả →</Link>
              </div>
              
              {orders.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-[2rem] p-12 text-center">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-20" />
                  <p className="font-bold text-muted-foreground">Bạn chưa có đơn đặt hàng nào.</p>
                  <Link to="/products" className="mt-4 inline-block gradient-primary text-white px-8 py-3 rounded-full font-black uppercase text-xs">Mua sắm ngay</Link>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all group shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex gap-4 items-center">
                         <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-primary" />
                         </div>
                         <div>
                            <p className="font-black text-sm uppercase tracking-tight">Đơn hàng #{order.orderNumber}</p>
                            <p className="text-[10px] font-bold text-muted-foreground opacity-60">{new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} sản phẩm</p>
                         </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="text-right">
                          <p className="font-black text-lg text-primary">{formatPrice(order.total)}</p>
                          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                            order.status === 'delivered' ? 'bg-success/10 text-success' :
                            order.status === 'shipped' ? 'bg-primary/10 text-primary' :
                            order.status === 'cancelled' ? 'bg-sale/10 text-sale' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {order.status === 'pending' ? 'Chờ xử lý' : 
                             order.status === 'confirmed' ? 'Đã xác nhận' :
                             order.status === 'shipped' ? 'Đang giao' :
                             order.status === 'delivered' ? 'Đã nhận' : 'Đã hủy'}
                          </span>
                        </div>
                        <Link to={`/order-tracking?id=${order.orderNumber}`} className="p-2 bg-secondary rounded-full hover:bg-primary hover:text-white transition-all">
                           <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "points" && (
            <div className="space-y-6">
              <h2 className="font-black text-2xl uppercase tracking-tighter">Hệ thống NovaPoints</h2>
              <div className="gradient-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                 <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                       <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Số dư hiện tại</p>
                       <div className="flex items-baseline gap-2">
                          <p className="text-6xl font-black">{points}</p>
                          <p className="text-xl font-bold opacity-80">Points</p>
                       </div>
                    </div>
                    <div className="text-center md:text-right">
                       <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Giá trị quy đổi</p>
                       <p className="text-4xl font-black opacity-90">{formatPrice(points * 1000)}</p>
                    </div>
                 </div>
                 <div className="mt-8 pt-6 border-t border-white/20 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
                    <span className="bg-white/10 px-4 py-2 rounded-full">Tích 1% cho mỗi đơn hàng</span>
                    <span className="bg-white/10 px-4 py-2 rounded-full">Giảm tối đa 50% đơn tiếp theo</span>
                 </div>
              </div>
              
              <div className="bg-card border border-border rounded-2xl p-6">
                 <h3 className="font-black mb-4 uppercase tracking-tight">Quy trình tích điểm NovaX</h3>
                 <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-4 bg-secondary/50 rounded-2xl border border-border">
                       <p className="text-xs font-black text-primary mb-2">BƯỚC 1</p>
                       <p className="text-sm font-bold">Mua sắm sản phẩm điện máy tại NovaX</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-2xl border border-border">
                       <p className="text-xs font-black text-primary mb-2">BƯỚC 2</p>
                       <p className="text-sm font-bold">Tích lũy 1% giá trị đơn hàng (vd: 10tr tích 10đ)</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-2xl border border-border">
                       <p className="text-xs font-black text-primary mb-2">BƯỚC 3</p>
                       <p className="text-sm font-bold">Dùng 1 điểm = 1.000đ trừ trực tiếp vào giỏ hàng</p>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-black text-2xl uppercase tracking-tighter">Sổ địa chỉ</h2>
                <button 
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="text-xs font-black gradient-accent text-white px-6 py-2.5 rounded-full uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  {showAddressForm ? 'Hủy bỏ' : '+ Thêm địa chỉ mới'}
                </button>
              </div>

              {showAddressForm && (
                <div className="bg-card border-2 border-primary/20 rounded-[2rem] p-8 shadow-xl animate-fade-in mb-8">
                   <h3 className="font-black text-xl mb-6 uppercase tracking-tight">Thông tin địa chỉ mới</h3>
                   
                   {/* Tabs for input method */}
                   <div className="flex gap-2 mb-8 bg-secondary/30 p-1 rounded-xl w-fit">
                      <button
                        onClick={() => setAddressInputMethod('manual')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                          addressInputMethod === 'manual' 
                            ? 'bg-primary text-white' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                        Nhập tay
                      </button>
                      <button
                        onClick={() => setAddressInputMethod('maps')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                          addressInputMethod === 'maps' 
                            ? 'bg-primary text-white' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Map className="w-4 h-4" />
                        Google Maps
                      </button>
                   </div>

                   {/* Manual Input Tab */}
                   {addressInputMethod === 'manual' && (
                      <div className="grid md:grid-cols-2 gap-4 mb-8">
                        <div>
                           <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Họ tên người nhận</label>
                           <input value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} className="w-full mt-1 px-5 py-3 rounded-xl border border-border bg-secondary/30 font-bold focus:bg-white transition-all outline-none" placeholder="VD: Long Trần" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Số điện thoại</label>
                           <input value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} className="w-full mt-1 px-5 py-3 rounded-xl border border-border bg-secondary/30 font-bold focus:bg-white transition-all outline-none" placeholder="09xxxxxxx" />
                        </div>
                        <div className="md:col-span-2">
                           <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Địa chỉ cụ thể (Số nhà, Đường, Phường)</label>
                           <input value={newAddress.streetAddress} onChange={e => setNewAddress({...newAddress, streetAddress: e.target.value})} className="w-full mt-1 px-5 py-3 rounded-xl border border-border bg-secondary/30 font-bold focus:bg-white transition-all outline-none" placeholder="VD: 123 Lê Lợi, P1" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Quận/Huyện</label>
                           <input value={newAddress.district} onChange={e => setNewAddress({...newAddress, district: e.target.value})} className="w-full mt-1 px-5 py-3 rounded-xl border border-border bg-secondary/30 font-bold focus:bg-white transition-all outline-none" placeholder="VD: Quận 1" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Phường/Xã</label>
                           <input value={newAddress.ward} onChange={e => setNewAddress({...newAddress, ward: e.target.value})} className="w-full mt-1 px-5 py-3 rounded-xl border border-border bg-secondary/30 font-bold focus:bg-white transition-all outline-none" placeholder="VD: Phường Bến Nghé" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Tỉnh/Thành phố</label>
                           <input value={newAddress.province} onChange={e => setNewAddress({...newAddress, province: e.target.value})} className="w-full mt-1 px-5 py-3 rounded-xl border border-border bg-secondary/30 font-bold focus:bg-white transition-all outline-none" placeholder="VD: TP. Hồ Chí Minh" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Loại địa chỉ</label>
                           <select value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})} className="w-full mt-1 px-5 py-3 rounded-xl border border-border bg-secondary/30 font-bold outline-none">
                              <option value="Nhà riêng">Nhà riêng</option>
                              <option value="Công ty">Công ty</option>
                              <option value="Khác">Khác</option>
                           </select>
                        </div>
                        <div className="flex items-end pb-3">
                           <label className="flex items-center gap-3 cursor-pointer select-none">
                              <input type="checkbox" checked={newAddress.isDefault} onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})} className="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
                              <span className="text-sm font-bold">Đặt làm mặc định</span>
                           </label>
                        </div>
                      </div>
                   )}

                   {/* Maps Input Tab */}
                   {addressInputMethod === 'maps' && (
                      <div className="mb-8">
                        <div className="mb-6">
                          <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 block mb-2">Chọn địa chỉ từ OpenStreetMap (Miễn phí)</label>
                          <OpenStreetMapPicker onAddressSelect={handleMapAddressSelect} />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Họ tên người nhận</label>
                             <input value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} className="w-full mt-1 px-5 py-3 rounded-xl border border-border bg-secondary/30 font-bold focus:bg-white transition-all outline-none" placeholder="VD: Long Trần" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Số điện thoại</label>
                             <input value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} className="w-full mt-1 px-5 py-3 rounded-xl border border-border bg-secondary/30 font-bold focus:bg-white transition-all outline-none" placeholder="09xxxxxxx" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Loại địa chỉ</label>
                             <select value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})} className="w-full mt-1 px-5 py-3 rounded-xl border border-border bg-secondary/30 font-bold outline-none">
                                <option value="Nhà riêng">Nhà riêng</option>
                                <option value="Công ty">Công ty</option>
                                <option value="Khác">Khác</option>
                             </select>
                          </div>
                          <div className="flex items-end pb-3">
                             <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input type="checkbox" checked={newAddress.isDefault} onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})} className="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
                                <span className="text-sm font-bold">Đặt làm mặc định</span>
                             </label>
                          </div>
                        </div>
                      </div>
                   )}

                   <button onClick={handleAddAddress} className="w-full gradient-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Lưu địa chỉ ngay</button>
                </div>
              )}

              <div className="grid gap-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-[2rem]">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-2" />
                    <p className="text-muted-foreground font-bold">Chưa có địa chỉ nào được lưu.</p>
                  </div>
                ) : (
                  addresses.map(addr => (
                    <div key={addr.id} className={`bg-card border-2 rounded-2xl p-6 relative group transition-all ${addr.isDefault ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-black text-lg uppercase tracking-tight">{addr.fullName}</span>
                            <span className="text-[10px] font-black uppercase bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{addr.label}</span>
                            {addr.isDefault && <CheckCircle2 className="w-5 h-5 text-success" />}
                          </div>
                          <p className="text-sm font-bold text-muted-foreground">{addr.phone}</p>
                          <p className="text-sm font-medium leading-relaxed uppercase tracking-tight opacity-80">
                            {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                          </p>
                        </div>
                        <div className="flex sm:flex-col justify-end gap-2">
                           {!addr.isDefault && (
                             <button onClick={() => handleDeleteAddress(addr.id!)} className="p-3 text-sale bg-sale/10 rounded-xl hover:bg-sale hover:text-white transition-all shadow-sm">
                                <Trash2 className="w-5 h-5" />
                             </button>
                           )}
                           <button className="p-3 bg-secondary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">
                              <Star className="w-5 h-5" />
                           </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "warranties" && (
            <div className="space-y-4">
              <h2 className="font-black text-2xl uppercase tracking-tighter">Bảo hành điện tử</h2>
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                 <p className="text-sm font-bold text-muted-foreground mb-8 bg-secondary/50 p-4 rounded-xl border-l-4 border-primary">
                    🛡️ Mọi sản phẩm mua tại NovaX đều được kích hoạt bảo hành điện tử 1 năm tự động ngay khi giao hàng thành công.
                 </p>
                 
                 <div className="space-y-6">
                    {orders.filter(o => o.status === 'delivered').length === 0 ? (
                       <div className="text-center py-12">
                          <ShieldCheck className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                          <p className="font-bold text-muted-foreground">Chưa có bản ghi bảo hành nào.</p>
                       </div>
                    ) : (
                      orders.filter(o => o.status === 'delivered').map(order => (
                        <div key={order.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <p className="font-black text-sm uppercase">Sản phẩm từ đơn #{order.orderNumber}</p>
                                 <p className="text-[10px] font-bold text-muted-foreground uppercase">Kích hoạt: {new Date(order.createdAt).toLocaleDateString()}</p>
                              </div>
                              <span className="text-[10px] font-black uppercase text-success bg-success/10 px-3 py-1 rounded-full">Đang hiệu lực</span>
                           </div>
                           <div className="bg-secondary/30 rounded-2xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-border">
                                    <ShieldCheck className="w-6 h-6 text-success" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-bold uppercase">Thời hạn bảo hành</p>
                                    <p className="text-sm font-black text-primary">Hết hạn: {new Date(new Date(order.createdAt).setFullYear(new Date(order.createdAt).getFullYear() + 1)).toLocaleDateString()}</p>
                                 </div>
                              </div>
                              <button className="text-[10px] font-black text-primary uppercase border-b-2 border-primary">Chi tiết</button>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
            </div>
          )}

          {activeTab === "wishlist" && (
            <div>
              <h2 className="font-black text-2xl uppercase tracking-tighter mb-4">Danh sách yêu thích</h2>
              {wishlistItems.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-[2rem] p-12 text-center">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                  <p className="font-bold text-muted-foreground mb-6">Bạn chưa có sản phẩm nào trong danh sách.</p>
                  <Link to="/products" className="gradient-primary text-white px-8 py-3 rounded-full font-black uppercase text-xs">Khám phá ngay</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistItems.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
