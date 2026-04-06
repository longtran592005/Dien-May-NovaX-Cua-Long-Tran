import { Link } from "react-router-dom";
import { categories } from "@/data/mockData";

const Footer = () => (
  <footer className="bg-foreground text-primary-foreground mt-12">
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-lg">NovaX</h3>
          </div>
          <p className="text-sm opacity-70">Siêu thị điện máy trực tuyến hàng đầu Việt Nam. Cam kết hàng chính hãng, giá tốt nhất.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Danh mục</h4>
          <div className="space-y-1.5">
            {categories.slice(0, 5).map(cat => (
              <Link key={cat.id} to={`/products?category=${cat.slug}`} className="block text-sm opacity-70 hover:opacity-100 transition-opacity">
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Hỗ trợ</h4>
          <div className="space-y-1.5 text-sm opacity-70">
            <p>Hotline: 1900 1234</p>
            <p>Email: support@novax.vn</p>
            <p>Đổi trả trong 30 ngày</p>
            <p>Bảo hành chính hãng</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Chính sách</h4>
          <div className="space-y-1.5 text-sm opacity-70">
            <p>Chính sách bảo hành</p>
            <p>Chính sách đổi trả</p>
            <p>Chính sách vận chuyển</p>
            <p>Điều khoản sử dụng</p>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-sm opacity-50">
        © 2024 NovaX. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
