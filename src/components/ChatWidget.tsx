import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

const ChatWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-80 bg-card rounded-2xl shadow-float border border-border animate-fade-in overflow-hidden">
          <div className="gradient-primary px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-foreground">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Tư vấn AI</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 h-64 flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto space-y-3">
              <div className="bg-secondary rounded-lg px-3 py-2 text-sm max-w-[80%]">
                Xin chào! 👋 Tôi là trợ lý AI của NovaX. Bạn cần tư vấn sản phẩm gì?
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <button className="gradient-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-opacity">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="gradient-accent text-accent-foreground p-4 rounded-full shadow-float hover:scale-110 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ChatWidget;
