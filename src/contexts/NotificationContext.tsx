import React, { createContext, useContext, useState, useCallback } from "react";

export interface Notification {
  id: string;
  type: "order" | "promo" | "system";
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "date" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const defaultNotifications: Notification[] = [
  {
    id: "n1", type: "promo", title: "Flash Sale sắp bắt đầu!",
    message: "Giảm đến 50% cho tất cả điện thoại. Bắt đầu lúc 12:00 hôm nay.",
    date: "2026-04-07", read: false, link: "/products?category=dien-thoai"
  },
  {
    id: "n2", type: "order", title: "Đơn hàng DH002 đang giao",
    message: "Đơn hàng của bạn đã được giao cho đơn vị vận chuyển.",
    date: "2026-04-06", read: false, link: "/order-tracking"
  },
  {
    id: "n3", type: "system", title: "Chào mừng bạn đến NovaX!",
    message: "Khám phá hàng ngàn sản phẩm điện máy chính hãng với giá tốt nhất.",
    date: "2026-04-05", read: true
  },
  {
    id: "n4", type: "promo", title: "Mã giảm giá NOVAX100K",
    message: "Giảm 100.000đ cho đơn hàng từ 2 triệu. Hạn sử dụng: 30/04/2026.",
    date: "2026-04-04", read: true, link: "/products"
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, "id" | "date" | "read">) => {
    const newNotif: Notification = {
      ...notification,
      id: `n_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
};
