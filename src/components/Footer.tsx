import { Link } from "react-router-dom";
import { categories } from "@/data/mockData";
import { MapPin, Phone, Mail, Shield, RotateCcw, Truck, FileText, Facebook, Youtube } from "lucide-react";

const Footer = () => (
  <footer className="bg-[#0A0D14] text-white/70 mt-20 pt-16 relative overflow-hidden">
    {/* Decorative background glow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

    <div className="container mx-auto px-6 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-10 md:gap-8 mb-12">
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-black text-2xl text-white tracking-tight">NovaX</h3>
          </div>
          <p className="text-sm leading-relaxed mb-6 max-w-xs font-medium">
            Điểm đến cuối cùng cho tín đồ công nghệ. Hành trình mua sắm đẳng cấp, hậu mãi chuẩn 5 sao.
          </p>
          <div className="flex gap-3">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:text-white hover:border-primary/50 transition-all duration-300 group">
              <Facebook className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-sale/20 hover:text-sale hover:border-sale/50 transition-all duration-300 group">
              <Youtube className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-xs">Sản phẩm</h4>
          <div className="space-y-3">
            {categories.slice(0, 5).map(cat => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`} className="block text-sm font-medium hover:text-primary transition-colors hover:translate-x-1 transform duration-300 w-max">
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-xs">Hỗ trợ</h4>
          <div className="space-y-3 text-sm font-medium">
            <Link to="/order-tracking" className="block hover:text-primary transition-colors hover:translate-x-1 transform duration-300 w-max">Tra cứu đơn hàng</Link>
            <Link to="/stores" className="block hover:text-primary transition-colors hover:translate-x-1 transform duration-300 w-max">Hệ thống cửa hàng</Link>
            <Link to="/blog" className="block hover:text-primary transition-colors hover:translate-x-1 transform duration-300 w-max">Tin tức công nghệ</Link>
            <div className="pt-2">
              <a href="tel:19001234" className="flex items-center gap-2 hover:text-white transition-colors mb-2"><Phone className="w-4 h-4 text-primary" /> <span className="font-bold text-white">1900 1234</span></a>
              <a href="mailto:support@novax.vn" className="flex items-center gap-2 hover:text-white transition-colors"><Mail className="w-4 h-4 text-primary" /> support@novax.vn</a>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-xs">Chính sách</h4>
          <div className="space-y-3 text-sm font-medium">
            <Link to="/policy" className="flex items-center gap-2 hover:text-white transition-colors"><Shield className="w-4 h-4 text-primary/70" /> Bảo hành 24 tháng</Link>
            <Link to="/policy" className="flex items-center gap-2 hover:text-white transition-colors"><RotateCcw className="w-4 h-4 text-primary/70" /> Đổi trả 30 ngày</Link>
            <Link to="/policy" className="flex items-center gap-2 hover:text-white transition-colors"><Truck className="w-4 h-4 text-primary/70" /> Miễn phí vận chuyển</Link>
            <Link to="/policy" className="flex items-center gap-2 hover:text-white transition-colors"><FileText className="w-4 h-4 text-primary/70" /> Điều khoản chung</Link>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-xs">Trải nghiệm</h4>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mx-auto backdrop-blur-sm">
            <p className="flex items-start gap-2 text-sm font-medium text-white/80 mb-3"><MapPin className="w-4 h-4 mt-0.5 text-sale shrink-0" /> Cơ sở siêu trải nghiệm: 123 Nguyễn Huệ, Quận 1.</p>
            <p className="text-xs text-white/50">Mở cửa: 8:00 - 22:00 (Cả chủ nhật và Lễ)</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 flex flex-col md:flex-row items-center justify-between text-xs font-medium">
        <p>© 2026 NovaX Corporation. Đã đăng ký bản quyền.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <Link to="/" className="hover:text-white transition-colors">Thiết kế bởi Trần Văn Long</Link>
          <Link to="/" className="hover:text-white transition-colors">Điều khoản</Link>
          <Link to="/" className="hover:text-white transition-colors">Bảo mật</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
