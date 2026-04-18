import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, ShieldCheck, Truck, CreditCard, RefreshCw } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content: string;
  time: string;
}

interface ChatShortcut {
  label: string;
  text: string;
}

const quickReplies: ChatShortcut[] = [
  { label: "Tư vấn", text: "Tư vấn điện thoại dưới 15 triệu" },
  { label: "So sánh", text: "So sánh iPhone vs Samsung" },
  { label: "Bảo hành", text: "Chính sách bảo hành" },
  { label: "Thanh toán", text: "Thanh toán bằng VNPay hay COD?" },
];

const defaultReply =
  "Cảm ơn bạn đã nhắn. Tôi có thể hỗ trợ nhanh các câu hỏi đơn giản về sản phẩm, thanh toán, giao hàng, bảo hành và đơn hàng. Nếu bạn cần chatbot AI thật sau này, phần xử lý này có thể thay bằng API mà không phải sửa giao diện.";

const getAIResponse = (input: string): string => {
  const lower = input.toLowerCase();

  if (!lower.trim()) {
    return defaultReply;
  }

  if (lower.includes("xin chào") || lower.includes("hello") || lower.includes("chào")) {
    return "Xin chào! Tôi có thể giúp bạn tìm sản phẩm, giải thích thanh toán, giao hàng và chính sách bảo hành. Bạn muốn hỏi phần nào trước?";
  }

  if (lower.includes("điện thoại") || lower.includes("phone") || lower.includes("smartphone")) {
    return "Trong tầm giá 10-15 triệu, bạn có thể tham khảo:\n• Samsung Galaxy S24 FE - pin tốt, camera cân bằng\n• iPhone 15 - ổn định, giữ giá tốt\n• Xiaomi 14 - cấu hình mạnh, sạc nhanh\n\nNếu muốn, tôi có thể lọc theo camera, pin hoặc game.";
  }

  if (lower.includes("laptop") || lower.includes("máy tính") || lower.includes("pc")) {
    return "Cho nhu cầu học tập, tôi gợi ý:\n• MacBook Air M3 - nhẹ, pin lâu\n• Dell Inspiron 14 - cân bằng giá/hiệu năng\n• HP Pavilion 15 - dễ dùng, phù hợp sinh viên\n\nBạn cần máy cho học tập, đồ hoạ hay lập trình?";
  }

  if (lower.includes("so sánh") || lower.includes("compare") || lower.includes("vs")) {
    return "So sánh nhanh thường sẽ dựa trên 3 điểm: hiệu năng, camera và giá trị sử dụng lâu dài. Nếu bạn nói rõ 2 mẫu máy, tôi có thể trả lời theo từng tiêu chí thay vì nói chung chung.";
  }

  if (lower.includes("bảo hành") || lower.includes("đổi trả") || lower.includes("trả hàng") || lower.includes("hoàn tiền")) {
    return "NovaX hỗ trợ theo hướng thực tế:\n• Kiểm tra tình trạng sản phẩm trước khi nhận\n• Bảo hành theo hãng / nhà phân phối\n• Hỗ trợ đổi trả theo chính sách từng nhóm hàng\n\nBạn muốn xem chính sách của sản phẩm nào?";
  }

  if (lower.includes("giao hàng") || lower.includes("ship") || lower.includes("vận chuyển") || lower.includes("giao nhanh")) {
    return "Đơn hàng thường có 2 trạng thái chính: đang xử lý và đang giao. Với COD, bạn thanh toán khi nhận hàng; với VNPay, hệ thống xác nhận thanh toán trước rồi mới chuyển sang xử lý giao hàng.";
  }

  if (lower.includes("vnpay") || lower.includes("cod") || lower.includes("thanh toán") || lower.includes("payment")) {
    return "Hiện tại NovaX ưu tiên 2 cách thanh toán:\n• VNPay - thanh toán online qua cổng ngân hàng / ví liên kết\n• COD - thanh toán khi nhận hàng\n\nNếu bạn muốn, tôi có thể hướng dẫn từng bước đặt hàng.";
  }

  if (lower.includes("đơn hàng") || lower.includes("order") || lower.includes("theo dõi") || lower.includes("tracking")) {
    return "Bạn có thể mở trang theo dõi đơn hàng để xem trạng thái đơn vừa đặt. Nếu đơn chưa xuất hiện, thường là do tài khoản chưa đăng nhập đúng hoặc đơn chưa được tạo xong.";
  }

  if (lower.includes("giá") || lower.includes("tầm giá") || lower.includes("ngân sách") || lower.includes("budget")) {
    return "Bạn muốn chi bao nhiêu? Hãy gửi mức giá hoặc nhu cầu, ví dụ: 'dưới 15 triệu, ưu tiên pin' và tôi sẽ gợi ý nhanh hơn.";
  }

  if (lower.includes("khuyến mãi") || lower.includes("giảm giá") || lower.includes("sale")) {
    return "Tôi có thể giúp bạn lọc theo ưu đãi, nhưng để chính xác hơn cần kết nối dữ liệu khuyến mãi thực tế sau này. Hiện tại tôi có thể trả lời theo rule đơn giản trước.";
  }

  return defaultReply;
};

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Xin chào! 👋 Tôi là trợ lý AI của NovaX. Bạn cần tư vấn sản phẩm gì?",
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const enqueueBotReply = (content: string) => {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    setIsTyping(true);
    typingTimeoutRef.current = window.setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        role: "bot",
        content: getAIResponse(content),
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 650);
  };

  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: content.trim(),
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    enqueueBotReply(content);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {open && (
        <div className="pointer-events-auto w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_24px_70px_-20px_rgba(15,23,42,0.35)] animate-fade-up">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_36%),linear-gradient(135deg,hsl(var(--primary)),hsl(var(--accent)))] px-4 py-4 text-primary-foreground">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(135deg, rgba(255,255,255,.24) 0, rgba(255,255,255,.24) 1px, transparent 1px, transparent 14px)", backgroundSize: "14px 14px" }} />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight">Trợ lý NovaX</p>
                  <p className="mt-0.5 text-xs text-primary-foreground/75">Hỏi nhanh, trả lời nhanh. Sẵn sàng nâng cấp lên AI thật sau này.</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-primary-foreground/80 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Đóng chatbot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-4 grid grid-cols-3 gap-2 text-[11px] text-primary-foreground/85 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/10 px-2 py-2 text-center backdrop-blur-sm">Sản phẩm</div>
              <div className="rounded-2xl bg-white/10 px-2 py-2 text-center backdrop-blur-sm">Thanh toán</div>
              <div className="rounded-2xl bg-white/10 px-2 py-2 text-center backdrop-blur-sm">Giao hàng</div>
              <div className="hidden rounded-2xl bg-white/10 px-2 py-2 text-center backdrop-blur-sm sm:block">Bảo hành</div>
            </div>
          </div>

          <div className="max-h-[min(34rem,calc(100vh-11rem))] overflow-hidden bg-card flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Câu hỏi phổ biến
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Đang trực
              </div>
            </div>

            <div className="flex flex-wrap gap-2 px-4 py-3">
              {quickReplies.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => sendMessage(item.text)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                >
                  {item.label === "Thanh toán" ? <CreditCard className="h-3.5 w-3.5" /> : item.label === "Bảo hành" ? <ShieldCheck className="h-3.5 w-3.5" /> : item.label === "So sánh" ? <RefreshCw className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                  {item.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-4 pt-1">
              <div className="rounded-2xl border border-border/70 bg-secondary/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
                Chatbot hiện tại dùng luật if/else đơn giản để trả lời nhanh. Sau này chỉ cần thay hàm phản hồi bằng API thực mà không phải sửa layout.
              </div>

              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "bot" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2.5 text-sm shadow-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground"
                        : "border border-border/80 bg-card text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-line leading-6">{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</p>
                  </div>

                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-end gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-card px-3 py-2.5 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t border-border bg-card p-3">
              <div className="flex gap-2 rounded-2xl border border-border bg-secondary/50 p-2 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nhập câu hỏi đơn giản..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="pointer-events-auto relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary text-accent-foreground shadow-[0_18px_40px_-10px_rgba(249,115,22,0.45)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
        aria-label={open ? "Đóng chatbot" : "Mở chatbot"}
      >
        <MessageCircle className={`h-6 w-6 transition-transform duration-300 ${open ? "rotate-90 scale-90" : ""}`} />
        {!open && <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-card bg-success" />}
      </button>
    </div>
  );
};

export default ChatWidget;
