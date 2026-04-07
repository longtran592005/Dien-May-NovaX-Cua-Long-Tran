import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content: string;
  time: string;
}

const quickReplies = [
  "Tư vấn điện thoại dưới 15 triệu",
  "So sánh iPhone vs Samsung",
  "Laptop cho sinh viên",
  "Chính sách bảo hành",
];

const botResponses: Record<string, string> = {
  "tư vấn": "Bạn quan tâm đến loại sản phẩm nào? Điện thoại, laptop, tivi hay gia dụng? 📱💻📺",
  "điện thoại": "Trong tầm giá 10-15 triệu, tôi đề xuất:\n• Samsung Galaxy S24 - Camera AI, pin 5000mAh\n• iPhone 15 - Chip A16, Dynamic Island\n• Xiaomi 14 - Camera Leica, sạc nhanh 90W\n\nBạn muốn xem chi tiết sản phẩm nào?",
  "laptop": "Cho sinh viên, tôi gợi ý:\n• MacBook Air M3 - Nhẹ, pin 18h\n• Dell XPS 15 - Màn OLED, hiệu năng cao\n• HP Pavilion 15 - Giá tốt, đa năng\n\nBạn cần laptop cho học tập hay đồ họa?",
  "bảo hành": "NovaX bảo hành chính hãng:\n• Điện thoại: 12 tháng\n• Laptop: 12-24 tháng\n• Tivi, tủ lạnh: 24 tháng\n\nĐổi trả miễn phí trong 30 ngày đầu! 🛡️",
  "so sánh": "iPhone vs Samsung - Điểm chính:\n• iPhone: Hệ sinh thái Apple, bảo mật cao, camera video tốt\n• Samsung: Tùy biến cao, camera zoom mạnh, sạc nhanh hơn\n\nBạn ưu tiên tính năng gì nhất?",
  "giá": "Bạn muốn xem sản phẩm trong tầm giá bao nhiêu? Tôi sẽ gợi ý phù hợp nhất! 💰",
  default: "Cảm ơn bạn! Tôi là trợ lý AI của NovaX. Tôi có thể giúp bạn:\n• Tư vấn sản phẩm\n• So sánh sản phẩm\n• Kiểm tra chính sách\n• Tìm khuyến mãi\n\nBạn cần hỗ trợ gì?",
};

const getAIResponse = (input: string): string => {
  const lower = input.toLowerCase();
  for (const [keyword, response] of Object.entries(botResponses)) {
    if (keyword !== "default" && lower.includes(keyword)) {
      return response;
    }
  }
  return botResponses.default;
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: content.trim(),
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        role: "bot",
        content: getAIResponse(content),
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-80 md:w-96 bg-card rounded-2xl shadow-float border border-border animate-fade-in overflow-hidden flex flex-col max-h-[500px]">
          <div className="gradient-primary px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-foreground">
              <Bot className="w-5 h-5" />
              <div>
                <span className="font-semibold text-sm">Tư vấn AI NovaX</span>
                <span className="block text-xs opacity-70">Trả lời tức thì 24/7</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px]">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "bot" && (
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "gradient-primary text-primary-foreground" : "bg-secondary"}`}>
                  <p className="whitespace-pre-line">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-accent" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div className="bg-secondary rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {quickReplies.map((text, i) => (
              <button key={i} onClick={() => sendMessage(text)} className="text-xs whitespace-nowrap px-2.5 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex-shrink-0">
                {text}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-border">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            <button type="submit" className="gradient-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="gradient-accent text-accent-foreground p-4 rounded-full shadow-float hover:scale-110 transition-transform relative"
      >
        <MessageCircle className="w-6 h-6" />
        {!open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-card"></span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
