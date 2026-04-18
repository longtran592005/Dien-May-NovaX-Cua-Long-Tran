import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Package, Tag, Info } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";

const iconMap = {
  order: Package,
  promo: Tag,
  system: Info,
};

const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative text-foreground hover:text-primary hover:bg-secondary p-2.5 flex items-center justify-center rounded-full transition-all">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-xl shadow-float border border-border overflow-hidden z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-bold text-sm">Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" /> Đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Không có thông báo</div>
            ) : (
              notifications.map(n => {
                const Icon = iconMap[n.type];
                return (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-secondary/50 ${!n.read ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'promo' ? 'bg-accent/10 text-accent' : n.type === 'order' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.date}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>}
                  </div>
                );
              })
            )}
          </div>
          <Link to="/products" onClick={() => setOpen(false)} className="block text-center py-2.5 border-t border-border text-sm text-primary hover:bg-secondary/50 font-medium">
            Xem tất cả
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
