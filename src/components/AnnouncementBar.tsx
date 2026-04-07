import { useState } from "react";
import { X, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";

const AnnouncementBar = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-accent to-orange-500 text-accent-foreground relative">
      <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm">
        <Megaphone className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">🔥 Flash Sale tháng 4 — Giảm đến 50% toàn bộ điện máy!</span>
        <Link to="/products" className="underline font-semibold hover:opacity-80 ml-1">Mua ngay →</Link>
        <button onClick={() => setVisible(false)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
