import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight, Tag } from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "b1", slug: "iphone-16-vs-samsung-s25",
    title: "So sánh iPhone 16 Pro Max vs Samsung Galaxy S25 Ultra: Nên mua máy nào?",
    excerpt: "Cùng đánh giá chi tiết 2 flagship hàng đầu 2026, từ thiết kế, camera đến hiệu năng để giúp bạn chọn được chiếc điện thoại phù hợp nhất.",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=400&fit=crop",
    author: "NovaX Tech", date: "05/04/2026", category: "So sánh", readTime: "8 phút"
  },
  {
    id: "b2", slug: "tu-lanh-inverter-la-gi",
    title: "Tủ lạnh Inverter là gì? Top 5 tủ lạnh Inverter đáng mua nhất 2026",
    excerpt: "Tìm hiểu công nghệ Inverter giúp tiết kiệm điện và top 5 tủ lạnh Inverter bán chạy nhất tại NovaX với giá ưu đãi.",
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&h=400&fit=crop",
    author: "NovaX Editor", date: "03/04/2026", category: "Hướng dẫn", readTime: "6 phút"
  },
  {
    id: "b3", slug: "cach-chon-laptop-hoc-tap",
    title: "Cách chọn laptop phù hợp cho sinh viên 2026: Từ 10 triệu đến 25 triệu",
    excerpt: "Hướng dẫn chi tiết cách chọn laptop theo nhu cầu và ngân sách, kèm gợi ý các mẫu laptop bán chạy nhất cho sinh viên.",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop",
    author: "NovaX Tech", date: "01/04/2026", category: "Hướng dẫn", readTime: "10 phút"
  },
  {
    id: "b4", slug: "khuyen-mai-thang-4",
    title: "Tổng hợp khuyến mãi tháng 4/2026: Giảm đến 50% toàn bộ điện máy",
    excerpt: "Cập nhật tất cả chương trình khuyến mãi hot nhất tháng 4 tại NovaX. Đặc biệt giảm sốc cho điện thoại, laptop và gia dụng.",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop",
    author: "NovaX Promo", date: "30/03/2026", category: "Khuyến mãi", readTime: "5 phút"
  },
  {
    id: "b5", slug: "dieu-hoa-inverter-tiet-kiem-dien",
    title: "5 mẹo sử dụng điều hòa Inverter tiết kiệm điện cho mùa hè",
    excerpt: "Bật mí cách sử dụng điều hòa Inverter đúng cách giúp tiết kiệm đến 40% tiền điện mỗi tháng.",
    image: "https://images.unsplash.com/photo-1585338107529-13afc25806f9?w=600&h=400&fit=crop",
    author: "NovaX Editor", date: "28/03/2026", category: "Mẹo hay", readTime: "4 phút"
  },
  {
    id: "b6", slug: "review-macbook-air-m3",
    title: "Đánh giá MacBook Air M3 sau 3 tháng sử dụng: Có đáng tiền?",
    excerpt: "Review chi tiết MacBook Air M3 về hiệu năng, pin, màn hình và trải nghiệm thực tế sau 3 tháng sử dụng hàng ngày.",
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&h=400&fit=crop",
    author: "NovaX Tech", date: "25/03/2026", category: "Đánh giá", readTime: "12 phút"
  },
];

const categories = ["Tất cả", "So sánh", "Hướng dẫn", "Khuyến mãi", "Mẹo hay", "Đánh giá"];

const BlogPage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Tin tức & Blog</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">Tin tức & Blog</h1>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {categories.map(cat => (
          <button key={cat} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${cat === "Tất cả" ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-primary/10'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Featured post */}
      <div className="mb-8 bg-card rounded-xl border border-border overflow-hidden">
        <div className="md:flex">
          <img src={blogPosts[0].image} alt={blogPosts[0].title} className="w-full md:w-1/2 h-64 md:h-auto object-cover" />
          <div className="p-6 flex flex-col justify-center">
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full w-fit mb-3">
              <Tag className="w-3 h-3" /> {blogPosts[0].category}
            </span>
            <h2 className="text-xl font-bold mb-3 hover:text-primary transition-colors cursor-pointer">
              {blogPosts[0].title}
            </h2>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{blogPosts[0].excerpt}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {blogPosts[0].author}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {blogPosts[0].date}</span>
              <span>{blogPosts[0].readTime} đọc</span>
            </div>
            <button className="inline-flex items-center gap-1 text-primary font-medium text-sm hover:underline w-fit">
              Đọc thêm <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts.slice(1).map(post => (
          <article key={post.id} className="bg-card rounded-xl border border-border overflow-hidden card-hover group">
            <div className="overflow-hidden">
              <img src={post.image} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-4">
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-2">
                {post.category}
              </span>
              <h3 className="font-bold text-sm mb-2 line-clamp-2 hover:text-primary transition-colors cursor-pointer">
                {post.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                <span>{post.readTime} đọc</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
